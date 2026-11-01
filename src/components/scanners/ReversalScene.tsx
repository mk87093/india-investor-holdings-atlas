import { useEffect, useRef, useState } from "react";
import type { FnoRow } from "@/lib/fno.functions";

export function ReversalScene({ up, down, sectors }: { up: FnoRow[]; down: FnoRow[]; sectors: Record<string, string> }) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let cleanup = () => {};
    void import("three").then((T) => {
      if (disposed) return;
      const css = getComputedStyle(element);
      const rgb = (token: string) => {
        const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return "rgb(128,128,128)";
        ctx.fillStyle = css.getPropertyValue(token).trim(); ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return `rgb(${d[0]},${d[1]},${d[2]})`;
      };
      const gain = rgb("--gain"), loss = rgb("--loss"), foreground = rgb("--foreground"), muted = rgb("--muted-foreground"), bg = rgb("--terminal");
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch { setUnavailable(true); return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      element.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-label", "Interactive 3D reversal stocks");
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(42, 1, .1, 100);
      const group = new T.Group(); scene.add(group);
      const textures: InstanceType<typeof T.Texture>[] = [];
      const targets: InstanceType<typeof T.Mesh>[] = [];
      const pulses: { mesh: InstanceType<typeof T.Mesh>; curve: InstanceType<typeof T.CatmullRomCurve3>; offset: number }[] = [];
      const makeLine = (points: InstanceType<typeof T.Vector3>[], color: string, opacity = .4) => {
        const geometry = new T.BufferGeometry().setFromPoints(points);
        const line = new T.Line(geometry, new T.LineBasicMaterial({ color, transparent: true, opacity })); group.add(line); return line;
      };
      for (let i = 0; i < 24; i++) {
        const y = -5.6 + i * .48;
        makeLine([new T.Vector3(-.35,y,-1),new T.Vector3(.35,y,-1)], i > 11 ? gain : loss, .6);
      }
      const addStock = (row: FnoRow, i: number, buy: boolean) => {
        const color = buy ? gain : loss;
        const column = i % 2, rank = Math.floor(i / 2);
        const x = (buy ? -1 : 1) * (3.0 + column * 4.6), y = 4.8 - rank * 2.4, z = column ? -1.5 : .3;
        const canvas = document.createElement("canvas"); canvas.width=720; canvas.height=280;
        const c = canvas.getContext("2d"); if (!c) return;
        c.fillStyle=bg; c.fillRect(0,0,720,280);
        c.strokeStyle=color; c.lineWidth=4; c.strokeRect(2,2,716,276);
        c.fillStyle=color; c.fillRect(0,0,7,280);
        c.font="bold 34px monospace"; c.fillStyle=foreground; c.fillText(row.symbol,24,49);
        c.font="21px sans-serif"; c.fillStyle=muted; c.fillText((sectors[row.symbol] || "Sector unavailable").slice(0,42),24,83);
        c.fillStyle=color; c.font="bold 26px monospace"; c.fillText(buy ? "BULL" : "BEAR",585,49);
        c.font="bold 38px monospace"; c.fillStyle=foreground; c.fillText(row.ltp.toFixed(2),24,145);
        c.font="23px monospace"; c.fillStyle=color; c.fillText(`${(buy ? row.fromLowPct : row.fromHighPct).toFixed(2)}% ${buy ? "FROM LOW" : "FROM HIGH"}`,24,198);
        c.fillStyle=muted; c.font="20px monospace"; c.fillText(`VOL ${row.volRatio?.toFixed(2) ?? "—"}x`,24,247);
        const prices=row.candles.map(k=>k.close); const min=Math.min(...prices), range=Math.max(...prices)-min || 1;
        c.strokeStyle=color; c.lineWidth=3; c.beginPath(); prices.forEach((price,j)=>{const px=370+j/Math.max(1,prices.length-1)*315,py=245-(price-min)/range*130; if(j===0)c.moveTo(px,py);else c.lineTo(px,py);}); c.stroke();
        const texture=new T.CanvasTexture(canvas); texture.colorSpace=T.SRGBColorSpace; textures.push(texture);
        const mesh=new T.Mesh(new T.PlaneGeometry(4.15,1.65),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
        mesh.position.set(x,y,z); mesh.rotation.y=buy ? .12 : -.12; mesh.userData["symbol"]=row.symbol; mesh.userData["buy"]=buy;
        group.add(mesh); targets.push(mesh);
        const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,-1),new T.Vector3(x*.35,y*.6,-2),new T.Vector3(x,y,z-.1)]);
        makeLine(curve.getPoints(40),color,.32);
        const pulse=new T.Mesh(new T.SphereGeometry(.045,8,8),new T.MeshBasicMaterial({color}));group.add(pulse);pulses.push({mesh:pulse,curve,offset:i/10});
      };
      up.slice(0,10).forEach((r,i)=>addStock(r,i,true)); down.slice(0,10).forEach((r,i)=>addStock(r,i,false));
      const resize = () => { const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.set(0,1,w<600?40:23);camera.lookAt(0,0,-1);camera.updateProjectionMatrix(); };
      const observer=new ResizeObserver(resize);observer.observe(element);resize();
      const pointer=new T.Vector2(); const raycaster=new T.Raycaster(); let mouseX=0,mouseY=0;
      const move=(e:PointerEvent)=>{const rect=element.getBoundingClientRect();mouseX=(e.clientX-rect.left)/rect.width-.5;mouseY=(e.clientY-rect.top)/rect.height-.5;};
      const click=(e:PointerEvent)=>{const rect=element.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(targets)[0];if(hit){const symbol=String(hit.object.userData["symbol"]);const side=hit.object.userData["buy"]?"buy":"sell";document.getElementById(`reversal-${side}-${symbol}`)?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center"});}};
      element.addEventListener("pointermove",move);element.addEventListener("click",click);
      const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setAnimationLoop((time)=>{if(!reduced){group.rotation.y+=(mouseX*.13+Math.sin(time*.0003)*.025-group.rotation.y)*.04;group.rotation.x+=(-mouseY*.06-group.rotation.x)*.04;pulses.forEach(p=>p.mesh.position.copy(p.curve.getPoint((time*.00012+p.offset)%1)));}renderer.render(scene,camera);});
      cleanup=()=>{renderer.setAnimationLoop(null);observer.disconnect();element.removeEventListener("pointermove",move);element.removeEventListener("click",click);scene.traverse(obj=>{if(obj instanceof T.Mesh || obj instanceof T.Line){obj.geometry.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());}});textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
    }).catch(()=>setUnavailable(true));
    return () => {disposed=true;cleanup();};
  }, [up,down,sectors]);
  return <div className="reversal-scene relative w-full overflow-hidden" ref={host}>{unavailable && <p className="p-6 text-sm text-muted-foreground">3D view unavailable on this device.</p>}</div>;
}