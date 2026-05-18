// Produtos armazenados no localStorage
let products = JSON.parse(localStorage.getItem('estoque_products')) || [];

let currentEditId = null;
let currentMovementId = null;
let currentMovementProduct = null;

// Salvar produtos no localStorage
function saveProducts() {
    localStorage.setItem('estoque_products', JSON.stringify(products));
    updateStats();
    renderProducts();
}

// Atualizar estatísticas
function updateStats() {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;

    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalValue').textContent = `R$ ${totalValue.toFixed(2)}`;
    document.getElementById('lowStockCount').textContent = lowStockCount;
}

// Mostrar mensagem de alerta
function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

// Cadastrar/Editar produto
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const minStock = parseInt(document.getElementById('productMinStock').value) || 5;
    const category = document.getElementById('productCategory').value;

    if (!name || isNaN(price) || isNaN(quantity)) {
        showAlert('Por favor, preencha todos os campos obrigatórios!', 'error');
        return;
    }

    if (currentEditId) {
        // Editar produto
        const index = products.findIndex(p => p.id === currentEditId);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                name,
                description,
                price,
                quantity,
                minStock,
                category
            };
            showAlert('Produto atualizado com sucesso!', 'success');
        }
        currentEditId = null;
        document.getElementById('formTitle').textContent = '📝 Cadastrar Produto';
        document.getElementById('submitBtn').textContent = 'Cadastrar Produto';
        document.getElementById('cancelBtn').style.display = 'none';
    } else {
        // Cadastrar novo produto
        const newProduct = {
            id: Date.now(),
            name,
            description,
            price,
            quantity,
            minStock,
            category,
            createdAt: new Date().toISOString()
        };
        products.push(newProduct);
        showAlert('Produto cadastrado com sucesso!', 'success');
    }

    saveProducts();
    this.reset();
});

// Cancelar edição
document.getElementById('cancelBtn').addEventListener('click', function() {
    currentEditId = null;
    document.getElementById('productForm').reset();
    document.getElementById('formTitle').textContent = '📝 Cadastrar Produto';
    document.getElementById('submitBtn').textContent = 'Cadastrar Produto';
    this.style.display = 'none';
});

// Editar produto
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        currentEditId = id;
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productMinStock').value = product.minStock;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('formTitle').textContent = '✏️ Editar Produto';
        document.getElementById('submitBtn').textContent = 'Atualizar Produto';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
        // Scroll para o formulário
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Excluir produto
function deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        showAlert('Produto excluído com sucesso!', 'success');
    }
}

// Abrir modal de movimentação
function openMovementModal(id, type) {
    currentMovementId = id;
    const product = products.find(p => p.id === id);
    if (product) {
        currentMovementProduct = product;
        const modalTitle = type === 'entry' ? '📥 Registrar Entrada' : '📤 Registrar Saída';
        document.getElementById('modalTitle').textContent = modalTitle;
        document.getElementById('movementType').value = type;
        document.getElementById('movementQuantity').value = '';
        document.getElementById('movementModal').style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('movementModal').style.display = 'none';
    currentMovementId = null;
    currentMovementProduct = null;
}

function confirmMovement() {
    const type = document.getElementById('movementType').value;
    const quantity = parseInt(document.getElementById('movementQuantity').value);
    
    if (isNaN(quantity) || quantity <= 0) {
        showAlert('Por favor, insira uma quantidade válida!', 'error');
        return;
    }

    const productIndex = products.findIndex(p => p.id === currentMovementId);
    if (productIndex !== -1) {
        const product = products[productIndex];
        
        if (type === 'entry') {
            product.quantity += quantity;
            showAlert(`Entrada de ${quantity} unidade(s) registrada com sucesso!`, 'success');
        } else {
            if (product.quantity < quantity) {
                showAlert(`Estoque insuficiente! Disponível: ${product.quantity}`, 'error');
                closeModal();
                return;
            }
            product.quantity -= quantity;
            showAlert(`Saída de ${quantity} unidade(s) registrada com sucesso!`, 'success');
        }
        
        saveProducts();
    }
    
    closeModal();
}

// Renderizar produtos
function renderProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) &&
        (categoryFilter === '' || p.category === categoryFilter)
    );
    
    const tbody = document.getElementById('productsList');
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(product => {
        let statusClass = '';
        let statusText = '';
        
        if (product.quantity <= 0) {
            statusClass = 'out-stock';
            statusText = '⚠️ Sem Estoque';
        } else if (product.quantity <= product.minStock) {
            statusClass = 'low-stock';
            statusText = '⚠️ Baixo Estoque';
        } else {
            statusText = '✅ Normal';
        }
        
        return `
            <tr class="${statusClass}">
                <td><strong>${escapeHtml(product.name)}</strong><br><small>${escapeHtml(product.description || 'Sem descrição')}</small></td>
                <td>${product.category}</td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>${statusText}</td>
                <td class="actions">
                    <button class="btn-success" onclick="openMovementModal(${product.id}, 'entry')" title="Registrar Entrada">📥</button>
                    <button class="btn-warning" onclick="openMovementModal(${product.id}, 'exit')" title="Registrar Saída">📤</button>
                    <button onclick="editProduct(${product.id})" title="Editar">✏️</button>
                    <button class="btn-danger" onclick="deleteProduct(${product.id})" title="Excluir">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Função para evitar XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners para busca e filtro
document.getElementById('searchInput').addEventListener('input', renderProducts);
document.getElementById('categoryFilter').addEventListener('change', renderProducts);

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('movementModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Inicializar
updateStats();
renderProducts();

// Exemplo de dados iniciais se não houver produtos
if (products.length === 0) {
    const initialProducts = [
        {
            id: Date.now() + 1,
            name: "Notebook Dell Inspiron",
            description: "15.6', 8GB RAM, 256GB SSD",
            price: 3500.00,
            quantity: 10,
            minStock: 5,
            category: "Eletrônicos",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            name: "Camiseta Polo",
            description: "Azul marinho, tamanho G",
            price: 79.90,
            quantity: 3,
            minStock: 10,
            category: "Vestuário",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            name: "Mouse Gamer",
            description: "RGB, 6 botões, 6400 DPI",
            price: 149.90,
            quantity: 15,
            minStock: 5,
            category: "Eletrônicos",
            createdAt: new Date().toISOString()
        }
    ];
    products.push(...initialProducts);
    saveProducts();
}