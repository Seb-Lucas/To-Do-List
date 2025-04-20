const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection Pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '', // Add your password if you have one
    database: 'todotagalog'
});

// Get all todos with optional status filter
app.get('/todos', (req, res) => {
    const { status } = req.query;
    let query = 'SELECT * FROM to_do';
    const params = [];
    
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).send('Database connection error');
        }

        connection.query(query, params, (err, rows) => {
            connection.release();
            
            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Database query error');
            }
            
            res.json(rows);
        });
    });
});

// Get todo by ID
app.get('/todos/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).send('Database connection error');
        }

        connection.query('SELECT * FROM to_do WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release();
            
            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Database query error');
            }
            
            if (rows.length === 0) {
                return res.status(404).send('Todo not found');
            }
            
            res.json(rows[0]);
        });
    });
});

// Add todo
app.post('/todos', (req, res) => {
    const { name, status = 'pending' } = req.body;
    
    if (!name) {
        return res.status(400).send('Name is required');
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).send('Database connection error');
        }

        connection.query(
            'INSERT INTO to_do (name, status) VALUES (?, ?)',
            [name, status],
            (err, result) => {
                connection.release();
                
                if (err) {
                    console.error('Query error:', err);
                    return res.status(500).send('Database query error');
                }
                
                res.status(201).send({
                    message: 'Todo created successfully',
                    id: result.insertId,
                    name,
                    status
                });
            }
        );
    });
});

// Update todo (name and/or status)
app.put('/todos/:id', (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;
    
    if (!name && !status) {
        return res.status(400).send('Either name or status must be provided');
    }

    let query = 'UPDATE to_do SET ';
    const updates = [];
    const params = [];
    
    if (name) {
        updates.push('name = ?');
        params.push(name);
    }
    
    if (status) {
        updates.push('status = ?');
        params.push(status);
    }
    
    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).send('Database connection error');
        }

        connection.query(query, params, (err, result) => {
            connection.release();
            
            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Database query error');
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).send('Todo not found');
            }
            
            res.send({
                message: 'Todo updated successfully',
                id,
                name: name || undefined,
                status: status || undefined
            });
        });
    });
});

// Update todo status only
app.patch('/todos/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).send('Status is required');
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).send('Database connection error');
        }

        connection.query(
            'UPDATE to_do SET status = ? WHERE id = ?',
            [status, id],
            (err, result) => {
                connection.release();
                
                if (err) {
                    console.error('Query error:', err);
                    return res.status(500).send('Database query error');
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).send('Todo not found');
                }
                
                res.send({
                    message: 'Todo status updated successfully',
                    id,
                    status
                });
            }
        );
    });
});

// Delete todo
app.delete('/todos/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).send('Database connection error');
        }

        connection.query('DELETE FROM to_do WHERE id = ?', [req.params.id], (err, result) => {
            connection.release();
            
            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Database query error');
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).send('Todo not found');
            }
            
            res.send({
                message: 'Todo deleted successfully',
                id: req.params.id
            });
        });
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Internal server error');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});