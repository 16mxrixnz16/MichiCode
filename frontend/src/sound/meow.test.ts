import {
  installMeowOnClicks,
  meow,
  MEOW_EVENT,
  MEOW_TYPES,
  MeowDetail,
  pickMeowType,
  registerCat,
  setMuted,
} from "./meow";

// jsdom no trae Web Audio: un AudioContext falso que cuenta los sonidos iniciados
const started: string[] = [];

const fakeParam = () => ({
  value: 0,
  setValueAtTime: jest.fn(),
  linearRampToValueAtTime: jest.fn(),
  exponentialRampToValueAtTime: jest.fn(),
});

const fakeNode = (kind: string) => {
  const node: any = {
    frequency: fakeParam(),
    gain: fakeParam(),
    Q: fakeParam(),
    type: "",
    buffer: null,
    connect: jest.fn((target: unknown) => target),
    start: jest.fn(() => started.push(kind)),
    stop: jest.fn(),
  };
  return node;
};

class FakeAudioContext {
  currentTime = 0;
  sampleRate = 8000;
  state = "running";
  destination = fakeNode("destination");
  createOscillator = () => fakeNode("oscillator");
  createGain = () => fakeNode("gain");
  createBiquadFilter = () => fakeNode("filter");
  createBufferSource = () => fakeNode("noise");
  createBuffer = (_c: number, length: number) => ({
    getChannelData: () => new Float32Array(length),
  });
  resume = jest.fn();
}

let uninstall: () => void;
let heard: MeowDetail[];
const onMeow = (e: Event) => heard.push((e as CustomEvent<MeowDetail>).detail);

beforeAll(() => {
  (window as any).AudioContext = FakeAudioContext;
});

beforeEach(() => {
  localStorage.clear();
  started.length = 0;
  heard = [];
  document.body.innerHTML = `
    <button id="normal">Acortar</button>
    <button id="icon"><svg><path id="inner"/></svg></button>
    <div data-no-meow><button id="silent">Silencio</button></div>
    <p id="text">Texto</p>
    <input id="field" />`;
  uninstall = installMeowOnClicks(document);
  window.addEventListener(MEOW_EVENT, onMeow);
});

afterEach(() => {
  uninstall();
  window.removeEventListener(MEOW_EVENT, onMeow);
});

const click = (id: string) => document.getElementById(id)!.click();

test("pickMeowType nunca repite el tipo anterior", () => {
  for (const previous of MEOW_TYPES) {
    for (let i = 0; i < 50; i++) {
      expect(pickMeowType(previous)).not.toBe(previous);
    }
  }
});

test("pickMeowType puede elegir cualquiera de los demás tipos", () => {
  const options = MEOW_TYPES.filter((t) => t !== "corto");
  const picked = options.map((_, i) =>
    pickMeowType("corto", () => i / options.length)
  );
  expect(picked).toEqual(options);
});

test("cada clic en un botón emite un maullido y el sonido se reproduce", () => {
  click("normal");
  expect(heard).toHaveLength(1);
  expect(MEOW_TYPES).toContain(heard[0].type);
  expect(started.length).toBeGreaterThan(0);
});

test("cualquier clic en la página maúlla, no solo en botones", () => {
  click("text");
  click("field");
  document.body.click();
  expect(heard).toHaveLength(3);
});

test("los clics seguidos alternan distintos tipos de maullido", () => {
  for (let i = 0; i < 40; i++) click("normal");
  expect(heard).toHaveLength(40);
  const types = heard.map((h) => h.type);
  for (let i = 1; i < types.length; i++) {
    expect(types[i]).not.toBe(types[i - 1]);
  }
  expect(new Set(types).size).toBeGreaterThanOrEqual(4);
});

test("maúlla también al hacer clic en el icono dentro de un botón", () => {
  document.getElementById("inner")!.dispatchEvent(
    new MouseEvent("click", { bubbles: true })
  );
  expect(heard).toHaveLength(1);
});

test("no maúlla dentro de zonas marcadas con data-no-meow", () => {
  click("silent");
  expect(heard).toHaveLength(0);
  expect(started).toHaveLength(0);
});

test("los maullidos los dice uno de los gatos registrados, o el gato indicado", () => {
  const offs = [registerCat("corazon", 1.2), registerCat("noche"), registerCat("nube", 0.9)];
  for (let i = 0; i < 20; i++) click("normal");
  expect(heard.every((h) => ["corazon", "noche", "nube"].includes(h.catId!))).toBe(true);

  heard = [];
  meow({ catId: "noche" });
  expect(heard[0].catId).toBe("noche");
  offs.forEach((off) => off());
});

test("silenciado no maúlla ni reproduce sonido", () => {
  setMuted(true);
  click("normal");
  expect(heard).toHaveLength(0);
  expect(started).toHaveLength(0);

  setMuted(false);
  click("normal");
  expect(heard).toHaveLength(1);
});
