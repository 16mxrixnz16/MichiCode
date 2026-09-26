// Motor de maullidos sintetizados con la Web Audio API (sin archivos de audio).
// Un maullido = oscilador "voz" -> filtro que imita la boca (m-i-a-u) -> envolvente de volumen.

export type MeowType =
  | "corto"
  | "largo"
  | "pregunta"
  | "trino"
  | "quejido"
  | "ronroneo";

export const MEOW_TYPES: MeowType[] = [
  "corto",
  "largo",
  "pregunta",
  "trino",
  "quejido",
  "ronroneo",
];

export const MEOW_LABELS: Record<MeowType, string> = {
  corto: "¡Miau!",
  largo: "Miaaaaau~",
  pregunta: "¿Miau?",
  trino: "¡Mrrp!",
  quejido: "Mieeeuuu…",
  ronroneo: "Purrrr…",
};

export const MEOW_EVENT = "michi:meow";
export const MUTE_EVENT = "michi:mute";
const MUTE_KEY = "michicode:muted";

// [momento (0..1 de la duración), valor]
type Curve = Array<[number, number]>;

interface Voice {
  duration: number;
  pitch: Curve; // Hz de la voz
  mouth: Curve; // frecuencia de corte del filtro: baja = boca cerrada ("m", "u")
  vibrato?: { rate: number; depth: number };
  trill?: number; // Hz del "rrr" (modulación de volumen)
}

const VOICES: Record<Exclude<MeowType, "ronroneo">, Voice> = {
  corto: {
    duration: 0.38,
    pitch: [[0, 620], [0.3, 900], [1, 520]],
    mouth: [[0, 700], [0.25, 3200], [0.7, 2200], [1, 700]],
  },
  largo: {
    duration: 1.05,
    pitch: [[0, 520], [0.25, 860], [0.7, 760], [1, 420]],
    mouth: [[0, 600], [0.2, 3000], [0.75, 2400], [1, 600]],
    vibrato: { rate: 6, depth: 14 },
  },
  pregunta: {
    duration: 0.55,
    pitch: [[0, 520], [0.4, 640], [1, 1050]],
    mouth: [[0, 700], [0.3, 2600], [1, 3400]],
  },
  trino: {
    duration: 0.36,
    pitch: [[0, 420], [0.5, 560], [1, 480]],
    mouth: [[0, 900], [0.4, 1800], [1, 1100]],
    trill: 30,
  },
  quejido: {
    duration: 1.25,
    pitch: [[0, 760], [0.3, 700], [1, 330]],
    mouth: [[0, 800], [0.2, 2600], [0.6, 1500], [1, 500]],
    vibrato: { rate: 4.5, depth: 22 },
  },
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function applyCurve(
  param: AudioParam,
  curve: Curve,
  start: number,
  duration: number,
  scale = 1
) {
  param.setValueAtTime(curve[0][1] * scale, start);
  for (const [t, value] of curve.slice(1)) {
    param.linearRampToValueAtTime(value * scale, start + t * duration);
  }
}

function playVoice(ctx: AudioContext, voice: Voice, out: AudioNode, pitch: number) {
  const now = ctx.currentTime + 0.01;
  // Cada maullido suena un poco distinto aunque sea del mismo tipo
  const jitter = (0.92 + Math.random() * 0.16) * pitch;
  const end = now + voice.duration;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  applyCurve(osc.frequency, voice.pitch, now, voice.duration, jitter);

  const mouth = ctx.createBiquadFilter();
  mouth.type = "lowpass";
  mouth.Q.value = 8;
  applyCurve(mouth.frequency, voice.mouth, now, voice.duration);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(1, now + 0.05);
  amp.gain.setValueAtTime(1, end - 0.12);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(mouth).connect(amp);
  const stops: AudioScheduledSourceNode[] = [osc];

  if (voice.vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = voice.vibrato.rate;
    depth.gain.value = voice.vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    stops.push(lfo);
  }

  if (voice.trill) {
    // El "rrr": el volumen sube y baja muy rápido
    const trill = ctx.createGain();
    trill.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.type = "square";
    lfo.frequency.value = voice.trill;
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(trill.gain);
    amp.connect(trill).connect(out);
    stops.push(lfo);
  } else {
    amp.connect(out);
  }

  stops.forEach((node) => {
    node.start(now);
    node.stop(end + 0.05);
  });
}

function playPurr(ctx: AudioContext, out: AudioNode) {
  const now = ctx.currentTime + 0.01;
  const duration = 1.4;

  // Ruido grave pulsado ~26 veces por segundo, en dos "respiraciones"
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 380;

  const pulse = ctx.createGain();
  pulse.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  lfo.frequency.value = 26;
  lfoDepth.gain.value = 0.5;
  lfo.connect(lfoDepth).connect(pulse.gain);

  const breath = ctx.createGain();
  applyCurve(
    breath.gain,
    [[0, 0.0001], [0.15, 1.6], [0.45, 1.2], [0.52, 0.2], [0.65, 1.4], [0.92, 1], [1, 0.0001]],
    now,
    duration
  );

  noise.connect(lowpass).connect(pulse).connect(breath).connect(out);
  [noise, lfo].forEach((node) => {
    node.start(now);
    node.stop(now + duration + 0.05);
  });
}

function play(type: MeowType, pitch: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  if (type === "ronroneo") playPurr(ctx, master);
  else playVoice(ctx, VOICES[type], master, pitch);
}

/** Elige un tipo de maullido al azar, distinto del anterior. */
export function pickMeowType(
  previous?: MeowType | null,
  random: () => number = Math.random
): MeowType {
  const options = MEOW_TYPES.filter((t) => t !== previous);
  return options[Math.floor(random() * options.length) % options.length];
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Sin almacenamiento (modo privado): el estado solo dura esta sesión
  }
  window.dispatchEvent(new CustomEvent(MUTE_EVENT, { detail: muted }));
}

// Gatos en pantalla y su tono de voz (1 = normal, >1 más agudo)
const cats = new Map<string, number>();

/** Registra un gato para que pueda "decir" los maullidos. Devuelve la función para quitarlo. */
export function registerCat(id: string, pitch = 1) {
  cats.set(id, pitch);
  return () => {
    cats.delete(id);
  };
}

export interface MeowDetail {
  type: MeowType;
  catId?: string;
}

interface MeowOptions {
  type?: MeowType;
  /** Gato que maúlla; si no se indica, lo dice uno de los gatos al azar. */
  catId?: string;
}

let lastType: MeowType | null = null;

/** Maúlla (si no está silenciado) y avisa a la UI con el evento MEOW_EVENT. */
export function meow({
  type = pickMeowType(lastType),
  catId,
}: MeowOptions = {}): MeowDetail | null {
  if (isMuted()) return null;
  lastType = type;

  const ids = Array.from(cats.keys());
  const speaker = catId ?? ids[Math.floor(Math.random() * ids.length)];
  const pitch = (speaker && cats.get(speaker)) || 1;

  try {
    play(type, pitch);
  } catch (error) {
    console.warn("No se pudo reproducir el maullido:", error);
  }
  const detail: MeowDetail = { type, catId: speaker };
  window.dispatchEvent(new CustomEvent<MeowDetail>(MEOW_EVENT, { detail }));
  return detail;
}

/**
 * Hace que cualquier clic dentro de `root` emita un maullido.
 * Los elementos dentro de `data-no-meow` quedan excluidos (p. ej. el botón de
 * silencio o los gatos, que maúllan con su propia voz).
 * Devuelve la función para quitar el listener.
 */
export function installMeowOnClicks(root: Document | HTMLElement = document) {
  const onClick = (event: Event) => {
    const target = event.target as Element | null;
    if (target?.closest?.("[data-no-meow]")) return;
    meow();
  };
  root.addEventListener("click", onClick, true);
  return () => root.removeEventListener("click", onClick, true);
}
