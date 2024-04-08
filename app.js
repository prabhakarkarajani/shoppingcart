const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
var cors = require('cors')
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to enable CORS
app.use(cors());
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Paths to JSON files
const productsFilePath = 'products.json';
const cartFilePath = 'cart.json';

// Read initial product and cart data from JSON files
let products = [];
let cart = [];

fs.readFile(productsFilePath, (err, data) => {
  if (err) throw err;
  products = JSON.parse(data);
});

fs.readFile(cartFilePath, (err, data) => {
  if (err) throw err;
  cart = JSON.parse(data);
});

// Get all products
app.get('/products', (req, res) => {
  res.json(products);
});

// Get product by ID
app.get('/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(product => product.id === productId);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// Add a new product
app.post('/products', (req, res) => {
    const { name, price, description } = req.body;
    const newProduct = {
      id: products.length + 1, // Assign a unique ID
      name,
      price,
      description
    };
    products.push(newProduct);
    // Write products data to file
    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
      if (err) throw err;
      res.status(201).json({ message: 'Product added successfully', product: newProduct });
    });
  });
  
  // Delete a product by ID
  app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const index = products.findIndex(product => product.id === productId);
    if (index !== -1) {
      products.splice(index, 1);
      // Write products data to file
      fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
        if (err) throw err;
        res.json({ message: 'Product deleted successfully' });
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  });
  
  // Add item to cart with billing and shipping information
  app.post('/cart', (req, res) => {
    const { productId, quantity, billingInfo, shippingInfo } = req.body;
    const product = products.find(product => product.id === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const existingCartItem = cart.find(item => item.productId === productId);
    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity, billingInfo, shippingInfo });
    }
    // Write cart data to file
    fs.writeFile(cartFilePath, JSON.stringify(cart, null, 2), err => {
      if (err) throw err;
      res.status(201).json({ message: 'Item added to cart successfully' });
    });
  });
  
  // Update billing and shipping information for an item in the cart
  app.put('/cart/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const { billingInfo, shippingInfo } = req.body;
    const cartItem = cart.find(item => item.productId === productId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    cartItem.billingInfo = billingInfo;
    cartItem.shippingInfo = shippingInfo;
    // Write cart data to file
    fs.writeFile(cartFilePath, JSON.stringify(cart, null, 2), err => {
      if (err) throw err;
      res.json({ message: 'Billing and shipping information updated successfully' });
    });
  });
  

// Calculate total amount for a product in the cart
const getProductTotalAmount = (productId, quantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return product.price * quantity;
  };
  
  // Calculate total quantity and total amount for all products in the cart
  const getCartTotals = () => {
    const total = { totalQuantity: 0, totalPrice: 0 };
    cart.forEach(item => {
      total.totalQuantity += item.quantity;
      total.totalPrice += getProductTotalAmount(item.productId, item.quantity);
    });
    return total;
  };
// Get cart contents with product details
app.get('/cart', (req, res) => {
    const cartWithProducts = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      const totalAmount = getProductTotalAmount(item.productId, item.quantity);
      return {
        id: item.id,
        name: product.name,
        description:product.description,
        productId: item.productId,
        quantity: item.quantity,
        image: product.image,
        title: product.title,
        price: product.price,
        totalAmount
      };
    }).filter(Boolean);
    const cartTotals = getCartTotals();
    console.log(cartWithProducts)
    res.json({
      items: cartWithProducts,
      totalQuantity: cartTotals.totalQuantity,
      totalPrice: cartTotals.totalPrice
    });
  });
  
// Delete item from cart
app.delete('/cart/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const index = cart.findIndex(item => item.productId === productId);
  if (index !== -1) {
    cart.splice(index, 1);
    // Write cart data to file
    fs.writeFile(cartFilePath, JSON.stringify(cart, null, 2), err => {
      if (err) throw err;
      res.json({ message: 'Item removed from cart successfully' });
    });
  } else {
    res.status(404).json({ message: 'Item not found in cart' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
