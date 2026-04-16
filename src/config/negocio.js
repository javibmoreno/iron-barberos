export const NEGOCIO_DEFAULT = {
  nombre: "Iron Barberos",
  barberos: ["Kevin", "Jefferson"],
  servicios: [
    { id: "1", nombre: "Corte de cabello", precio: 60000, slots: 2, descripcion: "Corte a tijera o máquina con acabado prolijo y definido." },
    { id: "2", nombre: "Retoque de barba", precio: 30000, slots: 2, descripcion: "Perfilado y arreglo de barba para un look limpio y cuidado." },
    { id: "3", nombre: "Barba con ritual",  precio: 40000, slots: 2, descripcion: "Afeitado completo con toalla caliente, productos y acabado premium." },
    { id: "4", nombre: "Cejas",             precio: 10000, slots: 1, descripcion: "Depilación y definición de cejas para un rostro más estilizado." },
  ],
  horario: {
    inicio: "09:00",
    fin: "20:00",
    slotMinutos: 30,
  },
  diasSemana: [1, 2, 3, 4, 5, 6], // 0=Dom, 1=Lun, ..., 6=Sáb
  moneda: "Gs.",
  pins: {
    admin: "Admin2608",
    config: "Config2402",
  },
};
