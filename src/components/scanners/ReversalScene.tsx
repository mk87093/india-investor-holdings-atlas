import { useEffect, useRef, useState } from "react";
import type { FnoRow } from "@/lib/fno.functions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CandleChart } from "./CandleChart";
import { REVERSAL_BOX_COUNT, REVERSAL_COLUMNS, REVERSAL_ROWS } from "@/lib/reversal-layout";

export function ReversalScene({ up, down, sectors }: { up: FnoRow[]; down: FnoRow[]; sectors: Record<string, string> }) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [selected, setSelected] = useState<{ symbol: string; buy: boolean } | null>(null);
  const selectedRow = selected ? (selected.buy ? up : down).find(row => row.symbol === selected.symbol) : undefined;
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
      const white = foreground;
      const ORIGIN = new T.Vector3(-10, 0, 0);
      // Origin point + glowing white divider
      const origin = new T.Mesh(new T.SphereGeometry(.22, 24, 24), new T.MeshBasicMaterial({ color: white })); origin.position.copy(ORIGIN); group.add(origin);
      const halo = new T.Mesh(new T.SphereGeometry(.5, 24, 24), new T.MeshBasicMaterial({ color: white, transparent: true, opacity: .15 })); halo.position.copy(ORIGIN); group.add(halo);
      const divider = new T.Mesh(new T.BoxGeometry(25, .06, .06), new T.MeshBasicMaterial({ color: white })); divider.position.set(2.5, 0, 0); group.add(divider);
      const dividerGlow = new T.Mesh(new T.BoxGeometry(25, .22, .22), new T.MeshBasicMaterial({ color: white, transparent: true, opacity: .12 })); dividerGlow.position.set(2.5, 0, 0); group.add(dividerGlow);
      const dividerCurve = new T.CatmullRomCurve3([ORIGIN.clone(), new T.Vector3(15, 0, 0)]);
      for (let i = 0; i < 3; i++) { const p = new T.Mesh(new T.SphereGeometry(.09, 10, 10), new T.MeshBasicMaterial({ color: white })); group.add(p); pulses.push({ mesh: p, curve: dividerCurve, offset: i / 3 }); }
      const COLS = REVERSAL_COLUMNS, BW = 3.6, BH = 1.5, GX = 4, GY = 1.85, X0 = -3;
      const addStock = (row: FnoRow, i: number, buy: boolean) => {
        const color = buy ? gain : loss;
        const col = i % COLS, rank = Math.floor(i / COLS);
        const x = X0 + col * GX, y = buy ? (REVERSAL_ROWS - rank) * GY : -(rank + 1) * GY, z = 0;
        const canvas = document.createElement("canvas"); canvas.width = 520; canvas.height = 200;
        const c = canvas.getContext("2d"); if (!c) return;
        c.fillStyle = bg; c.fillRect(0, 0, 520, 200);
        c.strokeStyle = color; c.lineWidth = 6; c.strokeRect(3, 3, 514, 194);
        c.fillStyle = muted; c.font = "20px monospace"; c.fillText(`#${i + 1}`, 18, 34);
        c.fillStyle = color; c.font = "bold 20px monospace"; c.fillText(buy ? "BUY" : "SELL", 440, 34);
        c.fillStyle = foreground; c.font = "bold 64px monospace";
        while (c.measureText(row.symbol).width > 484) { const size = Number.parseInt(c.font.replace("bold ", "")); c.font = `bold ${size - 1}px monospace`; }
        c.fillText(row.symbol, 18, 90);
        const pct = buy ? row.fromLowPct : row.fromHighPct;
        c.fillStyle = color; c.font = "bold 38px monospace"; c.fillText(`${buy ? "▲ +" : "▼ -"}${Math.abs(pct).toFixed(2)}%`, 18, 133);
        c.fillStyle = muted; c.font = "22px monospace"; c.fillText(buy ? "FROM LOW" : "FROM HIGH", 300, 131);
        c.fillStyle = foreground; c.font = "22px monospace"; c.fillText(`LTP ${row.ltp.toFixed(2)}`, 18, 163);
        c.fillStyle = muted; c.font = "18px monospace"; c.fillText(sectors[row.symbol] || "Sector unavailable", 18, 187, 484);
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
      up.slice(0, REVERSAL_BOX_COUNT).forEach((r, i) => addStock(r, i, true)); down.slice(0, REVERSAL_BOX_COUNT).forEach((r, i) => addStock(r, i, false));
      const resize = () => { const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;const fit=Math.max(13.5/Math.tan(T.MathUtils.degToRad(21))/camera.aspect, 12.5/Math.tan(T.MathUtils.degToRad(21)));camera.position.set(2.5,0,fit);camera.lookAt(2.5,0,0);camera.updateProjectionMatrix(); };
      const observer=new ResizeObserver(resize);observer.observe(element);resize();
      const pointer=new T.Vector2(); const raycaster=new T.Raycaster(); let mouseX=0,mouseY=0;
      const move=(e:PointerEvent)=>{const rect=element.getBoundingClientRect();mouseX=(e.clientX-rect.left)/rect.width-.5;mouseY=(e.clientY-rect.top)/rect.height-.5;};
      const click=(e:PointerEvent)=>{const rect=element.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);scene.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(targets)[0];if(hit){setSelected({symbol:String(hit.object.userData["symbol"]),buy:Boolean(hit.object.userData["buy"])});}};
      element.addEventListener("pointermove",move);element.addEventListener("click",click);
      const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setAnimationLoop((time)=>{if(!reduced){group.rotation.y+=(mouseX*.13+Math.sin(time*.0003)*.025-group.rotation.y)*.04;group.rotation.x+=(-mouseY*.06-group.rotation.x)*.04;pulses.forEach(p=>p.mesh.position.copy(p.curve.getPoint((time*.00012+p.offset)%1)));}renderer.render(scene,camera);element.setAttribute("data-scene-ready", "true");});
      cleanup=()=>{renderer.setAnimationLoop(null);observer.disconnect();element.removeAttribute("data-scene-ready");element.removeEventListener("pointermove",move);element.removeEventListener("click",click);scene.traverse(obj=>{if(obj instanceof T.Mesh || obj instanceof T.Line){obj.geometry.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());}});textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
    }).catch(()=>setUnavailable(true));
    return () => {disposed=true;cleanup();};
  }, [up,down,sectors]);
  return <>
    <div className="w-full overflow-x-auto"><div className="reversal-scene relative overflow-hidden" ref={host}>{unavailable && <p className="p-6 text-sm text-muted-foreground">3D view unavailable on this device.</p>}</div></div>
    <div className="sr-only focus-within:not-sr-only flex flex-wrap gap-2">{[...up.map(row => ({row, buy:true})), ...down.map(row => ({row, buy:false}))].map(({row,buy}) => <Button key={`${buy}-${row.symbol}`} variant="outline" onClick={() => setSelected({symbol:row.symbol,buy})}>Open {row.symbol} {buy ? "buy" : "sell"} 5-min chart</Button>)}</div>
    <Dialog open={Boolean(selectedRow)} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto bg-terminal text-foreground">
        {selectedRow && <><DialogHeader><DialogTitle className="pr-6 font-mono tracking-normal">{selectedRow.symbol} · 5-min chart</DialogTitle><DialogDescription>{sectors[selectedRow.symbol] || "Sector unavailable"} · LTP ₹{selectedRow.ltp.toFixed(2)} · {selected?.buy ? `${selectedRow.fromLowPct.toFixed(2)}% up from low` : `${selectedRow.fromHighPct.toFixed(2)}% down from high`} · 09:15–15:30 IST</DialogDescription></DialogHeader><CandleChart candles={selectedRow.candles} /></>}
      </DialogContent>
    </Dialog>
  </>;
}