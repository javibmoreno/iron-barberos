export const NEGOCIO_DEFAULT = {
  nombre: "Tajos Barbería",
  barberos: ["Carlos", "Matías", "Diego", "Rodrigo", "Nicolás"],
  servicios: [
    { id: "1", nombre: "Corte de cabello",            precio: 50000,  slots: 2 },
    { id: "2", nombre: "Arreglo de barba",             precio: 35000,  slots: 2 },
    { id: "3", nombre: "Corte + Barba",                precio: 75000,  slots: 2 },
    { id: "4", nombre: "Corte + Barba Ritual Premium", precio: 110000, slots: 2 },
  ],
  horario: {
    inicio: "09:00",
    fin: "19:30",
    slotMinutos: 30,
  },
  diasSemana: [1, 2, 3, 4, 5, 6], // 0=Dom, 1=Lun, ..., 6=Sáb
  moneda: "Gs.",
  pins: {
    admin: "Tajosbarber26",
    config: "Config2402",
  },
};
