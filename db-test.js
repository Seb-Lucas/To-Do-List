const mysql = require('mysql');

// Create connection pool with error handling
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '', // your password here
  database: 'todotagalog',
  connectTimeout: 10000 // 10 seconds
});

// Test connection immediately
pool.getConnection((err, connection) => {
  if (err) {
    console.error('DATABASE CONNECTION FAILED!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('⚠️ Check your username and password!');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('⚠️ Database does not exist!');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('⚠️ MySQL service not running!');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Successfully connected to database!');
  connection.release();
  
  // Start your Express server here
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});