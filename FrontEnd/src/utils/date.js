const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Formata data para exibição no feed: "Publicado em 12 de Setembro de 2022 às 16:00"
 * @param {string|Date} dateStr - ISO string ou Date
 * @returns {string}
 */
export function formatarDataPublicacao(dateStr) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '';
  const dia = d.getDate();
  const mes = MESES[d.getMonth()];
  const ano = d.getFullYear();
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `Publicado em ${dia} de ${mes} de ${ano} às ${horas}:${minutos}`;
}
