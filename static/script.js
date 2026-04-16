function togglePanel() {
    document.getElementById('sidePanel').classList.toggle('open');
}

function toggleMonthPanel() {
    document.getElementById('monthPanel').classList.toggle('open');
}

function addTransaction() {
    const name = document.getElementById('txName').value;
    const amount = document.getElementById('txAmount').value;
    const type = document.getElementById('txType').value;

    fetch('/add_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, type })
    })
    .then(() => location.reload());
}

function startNewMonth() {
    const pay = document.getElementById('pay').value;
    const balance = document.getElementById('balance').value;
    const savings = document.getElementById('savings').value;

    fetch('/new_month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay, balance, savings })
    })
    .then(res => res.json())
    .then(data => {
        location.reload();
    });
}
