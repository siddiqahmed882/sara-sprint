import { fetchData } from '../js/api.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const fetchResponse = await fetchData('/api/labs');
  if (!fetchResponse.isOk) {
    alert(fetchResponse.error);
    return;
  }

  const labs = fetchResponse.data;
  const labsTableBody = document.getElementById('labs-table-body');

  if (labs.length === 0) {
    labsTableBody.innerHTML = "<tr class='empty-row'><td colspan='5'>No labs found.</td></tr>";
    labsTableBody.removeAttribute('hidden');
    return;
  }

  for (const lab of labs) {
    if (!lab.patient) {
      continue;
    }
    const row = document.createElement('tr');
    row.className = 'lab-row';
    row.innerHTML = `
      <td>${lab.patient ? lab.patient.name : 'N/A'}</td>
      <td>${lab.labName}</td>
      <td>${new Date(lab.bookingDateTime).toLocaleDateString()}</td>
      <td>${new Date(lab.bookingDateTime).toLocaleTimeString()}</td>
      <td>${lab.testType}</td>
    `;
    labsTableBody.appendChild(row);
  }

  console.log('Labs:', labs);
  labsTableBody.removeAttribute('hidden');
}
