import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { MEOW_EVENT, MEOW_LABELS, MeowDetail } from "./sound/meow";

// Sin backend en los tests: las peticiones responden con listas vacías
jest.mock("axios", () => {
  // Funciones simples (no jest.fn): CRA reinicia los mocks antes de cada test
  const empty = () => Promise.resolve({ data: [] });
  const axios: any = empty;
  axios.create = () => ({ get: empty, post: () => Promise.resolve({ data: {} }) });
  return { __esModule: true, default: axios };
});

test("muestra el título, las herramientas y los tres gatos", async () => {
  render(<App />);

  expect(screen.getByRole("heading", { level: 1, name: "MichiCode" })).toBeInTheDocument();
  expect(screen.queryByText(/hola/i)).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Acortador de URLs" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Generador de QR" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /silenciar maullidos/i })).toBeInTheDocument();

  expect(screen.getByRole("button", { name: /^Corazón, gatita blanca con una mancha atigrada en forma de corazón/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Noche, gato negro/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Nube, gato gris con blanco/ })).toBeInTheDocument();

  // Historiales vacíos: caja de cartón vacía
  expect(await screen.findByText("Aún no has acortado ninguna URL")).toBeInTheDocument();
  expect(await screen.findByText("Aún no has generado ningún código QR")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Caja vacía: aún no hay URLs" })).toBeInTheDocument();
});

test("al hacer clic en un gato maúlla ese gato, y cualquier otro clic lo dice uno de los tres", async () => {
  render(<App />);
  await screen.findByText("Aún no has acortado ninguna URL");

  const heard: MeowDetail[] = [];
  const onMeow = (e: Event) => heard.push((e as CustomEvent<MeowDetail>).detail);
  window.addEventListener(MEOW_EVENT, onMeow);

  fireEvent.click(screen.getByRole("button", { name: /^Noche,/ }));
  expect(heard).toHaveLength(1);
  expect(heard[0].catId).toBe("noche");
  expect(await screen.findByText(MEOW_LABELS[heard[0].type])).toBeInTheDocument();

  fireEvent.click(screen.getByRole("heading", { name: "Historial" }));
  expect(heard).toHaveLength(2);
  expect(["corazon", "noche", "nube"]).toContain(heard[1].catId);

  window.removeEventListener(MEOW_EVENT, onMeow);
});
