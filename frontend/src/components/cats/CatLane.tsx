import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import Kitty, { COATS, CoatId, Pose } from "./Kitty";
import { YarnBall } from "./Illustrations";
import { meow, registerCat, MEOW_EVENT, MEOW_LABELS, MeowDetail } from "../../sound/meow";

// Franja de paseo de un gato. Vive en el flujo de la página (entre secciones),
// así el gato nunca queda encima de los recuadros con los que se interactúa.

const CAT_W = 120;
const WALK_SPEED = 55; // px/s
const RUN_SPEED = 180;

type Action =
  | "stand"
  | "walk"
  | "run"
  | "sit"
  | "lick"
  | "groom"
  | "yawn"
  | "sleep"
  | "stretch"
  | "bat"
  | "pounce";

interface CatState {
  x: number;
  facing: 1 | -1;
  pose: Pose;
  action: Action;
  moveMs: number;
}

interface Toy {
  x: number;
  ms: number;
  spin: number;
}

const ACTION_LABELS: Partial<Record<Action, string>> = {
  lick: "se lame la cola",
  groom: "se acicala",
  yawn: "bosteza",
  sleep: "duerme",
  stretch: "se estira",
  bat: "juega con el ovillo",
  pounce: "caza el láser",
  run: "persigue el láser",
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface CatLaneProps {
  coat: CoatId;
  /** Retraso inicial para que los gatos no se muevan sincronizados */
  delay?: number;
}

const CatLane: React.FC<CatLaneProps> = ({ coat, delay = 0 }) => {
  const info = COATS[coat];
  const laneRef = useRef<HTMLDivElement>(null);
  const [cat, setCat] = useState<CatState>({
    x: 0,
    facing: Math.random() < 0.5 ? 1 : -1,
    pose: "sit",
    action: "sit",
    moveMs: 0,
  });
  const catRef = useRef(cat);
  const [yarn, setYarn] = useState<Toy | null>(null);
  const [laser, setLaser] = useState<number | null>(null);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);

  // Voz propia del gato
  useEffect(() => registerCat(coat, info.pitch), [coat, info.pitch]);

  // Globo "¡Miau!" + saltito cuando este gato maúlla
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onMeow = (event: Event) => {
      const detail = (event as CustomEvent<MeowDetail>).detail;
      if (detail.catId !== coat) return;
      setBubble({ text: MEOW_LABELS[detail.type], id: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setBubble(null), 1500);
    };
    window.addEventListener(MEOW_EVENT, onMeow);
    return () => {
      window.removeEventListener(MEOW_EVENT, onMeow);
      clearTimeout(timer);
    };
  }, [coat]);

  // Rutina del gato: pasear y hacer cosas de gato, una tras otra
  useEffect(() => {
    const update = (patch: Partial<CatState>) => {
      catRef.current = { ...catRef.current, ...patch };
      setCat(catRef.current);
    };
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          timers.delete(t);
          resolve();
        }, ms);
        timers.add(t);
      });
    const maxX = () => Math.max(0, (laneRef.current?.clientWidth ?? 0) - CAT_W);
    // Posición del gato para que su patita delantera quede sobre `px`
    const reachX = (px: number, facing: 1 | -1) =>
      clamp(px - (facing === 1 ? CAT_W * 0.8 : CAT_W * 0.2), 0, maxX());

    const moveTo = async (x: number, run = false) => {
      const from = catRef.current.x;
      const dist = Math.abs(x - from);
      if (dist < 3) return;
      const ms = (dist / (run ? RUN_SPEED : WALK_SPEED)) * 1000;
      update({ x, facing: x > from ? 1 : -1, pose: "stand", action: run ? "run" : "walk", moveMs: ms });
      await wait(ms);
    };
    const doFor = async (pose: Pose, action: Action, ms: number) => {
      update({ pose, action, moveMs: 0 });
      await wait(ms);
    };

    const playWithYarn = async () => {
      const cat = catRef.current;
      let ballX = clamp(cat.x + CAT_W / 2 + (Math.random() < 0.5 ? -1 : 1) * rand(80, 140), 12, maxX() + CAT_W - 12);
      let spin = 0;
      setYarn({ x: ballX, ms: 0, spin });
      await wait(300);
      for (let i = 0; i < 3; i++) {
        const facing: 1 | -1 = ballX > catRef.current.x + CAT_W / 2 ? 1 : -1;
        await moveTo(reachX(ballX, facing));
        update({ facing });
        await doFor("stand", "bat", 900);
        const next = clamp(ballX + facing * rand(60, 150), 12, maxX() + CAT_W - 12);
        spin += facing * 360;
        ballX = next;
        setYarn({ x: next, ms: 1100, spin });
        await doFor("stand", "stand", 500);
      }
      await doFor("sit", "sit", 1600);
      setYarn(null);
    };

    const chaseLaser = async () => {
      for (let i = 0; i < 4; i++) {
        const dot = rand(10, maxX() + CAT_W - 10);
        setLaser(dot);
        await doFor("stand", "stand", 350);
        const facing: 1 | -1 = dot > catRef.current.x + CAT_W / 2 ? 1 : -1;
        await moveTo(reachX(dot, facing), true);
        update({ facing });
        await doFor("stand", "pounce", 520);
      }
      setLaser(null);
      await doFor("sit", "sit", 1400);
    };

    const routines: Array<() => Promise<void>> = [
      () => doFor("sit", "lick", 4200),
      () => doFor("sit", "groom", 3400),
      async () => {
        await doFor("sit", "yawn", 1600);
        await doFor("sit", "sit", 1400);
      },
      () => doFor("loaf", "sleep", 7000),
      async () => {
        await doFor("stand", "stretch", 2200);
        await doFor("sit", "sit", 1000);
      },
      playWithYarn,
      chaseLaser,
      () => doFor("sit", "sit", 2500),
    ];

    let cancelled = false;
    const live = async () => {
      await wait(delay);
      update({ x: rand(0, maxX()), moveMs: 0 });
      if (prefersReducedMotion()) {
        // Sin movimiento: solo alterna entre sentarse y dormir
        while (!cancelled) {
          await doFor("sit", "sit", 6000);
          await doFor("loaf", "sleep", 6000);
        }
        return;
      }
      let last = -1;
      while (!cancelled) {
        await moveTo(rand(0, maxX()));
        let next = Math.floor(Math.random() * routines.length);
        if (next === last) next = (next + 1) % routines.length;
        last = next;
        await routines[next]();
      }
    };
    live();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [delay]);

  const onPet = () => meow({ catId: coat });
  const doing = ACTION_LABELS[cat.action];

  return (
    <Box
      ref={laneRef}
      aria-label={`Paseo de ${info.name}`}
      sx={{
        position: "relative",
        height: { xs: 150, md: 165 },
        overflow: "hidden",
        my: { xs: 1, md: 2 },
      }}
    >
      {yarn && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: 10,
            left: yarn.x - 11,
            transition: `left ${yarn.ms}ms cubic-bezier(.2,.7,.4,1)`,
          }}
        >
          <Box sx={{ transform: `rotate(${yarn.spin}deg)`, transition: `transform ${yarn.ms}ms ease-out`, lineHeight: 0 }}>
            <YarnBall size={22} />
          </Box>
        </Box>
      )}
      {laser !== null && (
        <Box
          aria-hidden
          className="laser-dot"
          sx={{ position: "absolute", bottom: 12, left: laser - 5, width: 10, height: 10, borderRadius: "50%" }}
        />
      )}

      <Box
        data-no-meow
        role="button"
        tabIndex={0}
        title={`${info.name}${doing ? ` ${doing}` : ""}`}
        aria-label={`${info.name}, ${info.description}. Haz clic para que maúlle`}
        onClick={onPet}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPet();
          }
        }}
        sx={{
          position: "absolute",
          bottom: 4,
          left: cat.x,
          width: CAT_W,
          transition: `left ${cat.moveMs}ms linear`,
          cursor: "pointer",
          outline: "none",
          borderRadius: "16px",
          "&:focus-visible": { boxShadow: "0 0 0 3px rgba(124,58,237,.5)" },
        }}
      >
        {bubble && (
          <Box
            key={`b${bubble.id}`}
            className="michi-pop"
            sx={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              mb: -0.5,
              px: 1.2,
              py: 0.4,
              whiteSpace: "nowrap",
              borderRadius: "12px",
              bgcolor: "#fff",
              color: "primary.main",
              fontWeight: 900,
              fontSize: ".85rem",
              boxShadow: "0 6px 18px rgba(124,58,237,.25)",
              zIndex: 1,
            }}
          >
            {bubble.text}
          </Box>
        )}
        {bubble && (
          <Box key={`h${bubble.id}`} aria-hidden className="kitty-hearts">
            <span>💜</span>
            <span>💗</span>
          </Box>
        )}
        <Box
          key={`c${bubble?.id ?? 0}`}
          className={[bubble ? "michi-hop" : "", cat.action === "pounce" ? "kitty-pounce" : ""].join(" ")}
          sx={{ lineHeight: 0 }}
        >
          <Box sx={{ transform: `scaleX(${cat.facing})`, lineHeight: 0 }}>
            <Kitty coat={coat} pose={cat.pose} action={`is-${cat.action}`} width={CAT_W} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CatLane;
