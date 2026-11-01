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
      const white = "rgb(255,255,255)";
      const ORIGIN = new T.Vector3(-9, 0, 0);
      // Origin point + glowing white divider
      const origin = new T.Mesh(new T.SphereGeometry(.22, 24, 24), new T.MeshBasicMaterial({ color: white })); origin.position.copy(ORIGIN); group.add(origin);
      const halo = new T.Mesh(new T.SphereGeometry(.5, 24, 24), new T.MeshBasicMaterial({ color: white, transparent: true, opacity: .15 })); halo.position.copy(ORIGIN); group.add(halo);
      const divider = new T.Mesh(new T.BoxGeometry(21, .06, .06), new T.MeshBasicMaterial({ color: white })); divider.position.set(1.5, 0, 0); group.add(divider);
      const dividerGlow = new T.Mesh(new T.BoxGeometry(21, .22, .22), new T.MeshBasicMaterial({ color: white, transparent: true, opacity: .12 })); dividerGlow.position.set(1.5, 0, 0); group.add(dividerGlow);
      const dividerCurve = new T.CatmullRomCurve3([ORIGIN.clone(), new T.Vector3(12, 0, 0)]);
      for (let i = 0; i < 3; i++) { const p = new T.Mesh(new T.SphereGeometry(.09, 10, 10), new T.MeshBasicMaterial({ color: white })); group.add(p); pulses.push({ mesh: p, curve: dividerCurve, offset: i / 3 }); }
      const COLS = 5, BW = 2.6, BH = 1.0, GX = 2.9, GY = 1.25, X0 = -2.4;
      const addStock = (row: FnoRow, i: number, buy: boolean) => {
        const color = buy ? gain : loss;
        const col = i % COLS, rank = Math.floor(i / COLS);
        const x = X0 + col * GX, y = (buy ? 1 : -1) * (.95 + rank * GY), z = 0;
        const canvas = document.createElement("canvas"); canvas.width = 520; canvas.height = 200;
        const c = canvas.getContext("2d"); if (!c) return;
        c.fillStyle = bg; c.fillRect(0, 0, 520, 200);
        c.strokeStyle = color; c.lineWidth = 6; c.strokeRect(3, 3, 514, 194);
        c.fillStyle = muted; c.font = "20px monospace"; c.fillText(`#${i + 1}`, 18, 34);
        c.fillStyle = color; c.font = "bold 20px monospace"; c.fillText(buy ? "BUY" : "SELL", 440, 34);
        c.fillStyle = foreground; c.font = "bold 44px monospace"; c.fillText(row.symbol.slice(0, 14), 18, 90);
        const pct = buy ? row.fromLowPct : row.fromHighPct;
        c.fillStyle = color; c.font = "bold 36px monospace"; c.fillText(`${buy ? "▲ +" : "▼ -"}${Math.abs(pct).toFixed(2)}%`, 18, 145);
        c.fillStyle = muted; c.font = "20px monospace"; c.fillText(buy ? "FROM LOW" : "FROM HIGH", 300, 143);
        c.fillText(`LTP ${row.ltp.toFixed(2)}  ${(sectors[row.symbol] || "").slice(0, 18)}`, 18, 182);
        const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; textures.push(texture);
        const side = new T.MeshBasicMaterial({ color, transparent: true, opacity: .55 });
        const face = new T.MeshBasicMaterial({ map: texture });
        const mesh = new T.Mesh(new T.BoxGeometry(BW, BH, .35), [side, side, side, side, face, side]);
        mesh.position.set(x, y, z); mesh.userData["symbol"] = row.symbol; mesh.userData["buy"] = buy; mesh.userData["phase"] = i * .4;
        group.add(mesh); targets.push(mesh);
        const curve = new T.CatmullRomCurve3([ORIGIN.clone(), new T.Vector3(-6, (buy ? 1 : -1) * .3, 0), new T.Vector3(x - BW / 2 - .6, y, -.1), new T.Vector3(x - BW / 2, y, 0)]);
        makeLine(curve.getPoints(48), color, .35);
        const pulse = new T.Mesh(new T.SphereGeometry(.05, 8, 8), new T.MeshBasicMaterial({ color })); group.add(pulse); pulses.push({ mesh: pulse, curve, offset: i / 20 });
      };
      up.slice(0, 20).forEach((r, i) => addStock(r, i, true)); down.slice(0, 20).forEach((r, i) => addStock(r, i, false));
      const resize = () => { const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;const fit=Math.max(13/Math.tan(T.MathUtils.degToRad(21))/camera.aspect, 6.5/Math.tan(T.MathUtils.degToRad(21)));camera.position.set(1.5,0,fit);camera.lookAt(1.5,0,0);camera.updateProjectionMatrix(); };
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