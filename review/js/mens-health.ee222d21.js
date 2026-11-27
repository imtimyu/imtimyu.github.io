(() => {
const filters = document.querySelector('[data-fee-filters]');
if (!filters) return;
const choices = filters.querySelectorAll('[data-fee-filter]');
const rows = document.querySelectorAll('[data-fee-group]');
const status = document.querySelector('[data-fee-count]');
for (const choice of choices) {
choice.addEventListener('click', () => {
const group = choice.dataset.feeFilter;
for (const button of choices) {
button.setAttribute('aria-pressed', String(button === choice));
}
let visible = 0;
for (const row of rows) {
row.hidden = group !== 'all' && row.dataset.feeGroup !== group;
if (!row.hidden) visible++;
}
status.textContent = visible + (visible === 1 ? ' service shown' : ' services shown');
});
}
filters.hidden = false;
})();
