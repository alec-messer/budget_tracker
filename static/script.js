function toggleDeletePanel() {
    document.getElementById('deletePanel').classList.toggle('open');
}

function togglePanel() {
    document.getElementById('sidePanel').classList.toggle('open');
}

function addIngredient() {
    const container = document.getElementById('ingredients-container');

    const row = document.createElement('div');
    row.className = 'ingredient-row';

    row.innerHTML = `
        <input name="ingredient_name[]" placeholder="Ingredient" required>
        <input name="ingredient_qty[]" type="number" step="any" placeholder="Qty" required>

        <select name="ingredient_unit[]" required>
            <option value="">Unit</option>
            <option value="grams">grams</option>
            <option value="items">items</option>
        </select>

        <select name="ingredient_type[]" required>
            <option value="">Type</option>
            <option value="meat">meat</option>
            <option value="veg">veg</option>
            <option value="dairy">dairy</option>
            <option value="fruit">fruit</option>
            <option value="other">other</option>
        </select>
    `;

    container.appendChild(row);
}

function buildShoppingJSON(totals) {
    const items = [];

    Object.keys(totals).forEach(type => {
        Object.keys(totals[type]).forEach(name => {
            const { qty, unit } = totals[type][name];
            items.push({ name, qty, unit });
        });
    });

    return items;
}

function generateList() {
    const selects = document.querySelectorAll('.meal-select');

    const totals = {
        meat: {},
        dairy: {},
        fruit: {},
        veg: {},
        other: {}
    };

    selects.forEach(select => {
        const meal = select.value;

        if (meal && MEALS[meal]) {
            const ingredients = MEALS[meal];

            Object.keys(ingredients).forEach(item => {
                const data = ingredients[item];
                const type = data.type || 'other';

                if (!totals[type][item]) {
                    totals[type][item] = {
                        qty: 0,
                        unit: data.unit
                    };
                }

                totals[type][item].qty += data.qty;
            });
        }
    });

    const shoppingJSON = buildShoppingJSON(totals);

    fetch('/build_basket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shoppingJSON)
    })
    .then(res => res.json())
    .then(data => {

        let output = '';

        const now = new Date();
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

        output += `Shopping List\n${days[now.getDay()]} ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}\n\n`;

        const typeOrder = ['meat', 'veg', 'fruit', 'dairy', 'other'];

        typeOrder.forEach(type => {
            const items = totals[type];
            if (!Object.keys(items).length) return;

            output += `${type.toUpperCase()}\n`;

            const rows = Object.keys(items).sort().map(item => {
                const { qty, unit } = items[item];
                return { name: item, left: `${qty} (${unit})` };
            });

            const maxLeft = Math.max(...rows.map(r => r.left.length));

            rows.forEach(r => {
                output += `${r.left.padEnd(maxLeft)}  ${r.name}\n`;
            });

            output += `\n`;
        });

        output += `<a href="#" onclick="https://www.waitrose.com/ecom/sign-in">Login to Waitrose</a>`;

        document.getElementById('output').innerHTML = output;
        document.getElementById('output-card').classList.remove('hidden');
    });
}

function shareList() {
    const text = document.getElementById('output').innerText;

    if (navigator.share) {
        navigator.share({ title: 'Shopping List', text });
    }
}
