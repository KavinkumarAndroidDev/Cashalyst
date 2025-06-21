import db from './initDB';

// Transaction operations
export const addTransaction = (transaction) => {
  return new Promise((resolve, reject) => {
    const { id, amount, type, category, source, note, date } = transaction;
    
    db.transaction(
      (tx) => {
        // Insert transaction
        tx.executeSql(
          `INSERT INTO transactions (id, amount, type, category, source, note, date) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, amount, type, category, source, note, date]
        );

        // Update account balance
        const balanceChange = type === 'income' ? amount : -amount;
        tx.executeSql(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [balanceChange, source]
        );
      },
      (error) => {
        console.error('Add transaction error:', error);
        reject(error);
      },
      () => {
        console.log('Transaction added successfully');
        resolve();
      }
    );
  });
};

export const getTransactions = (filters = {}) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM transactions';
    let params = [];
    let conditions = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }

    if (filters.startDate) {
      conditions.push('date >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('date <= ?');
      params.push(filters.endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';

    db.transaction(
      (tx) => {
        tx.executeSql(query, params, (_, { rows }) => {
          resolve(rows._array);
        });
      },
      (error) => {
        console.error('Get transactions error:', error);
        reject(error);
      }
    );
  });
};

export const deleteTransaction = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // First get the transaction to update account balance
        tx.executeSql(
          'SELECT amount, type, source FROM transactions WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              const transaction = rows._array[0];
              const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
              
              // Update account balance
              tx.executeSql(
                'UPDATE accounts SET balance = balance + ? WHERE id = ?',
                [balanceChange, transaction.source]
              );
            }
          }
        );

        // Delete the transaction
        tx.executeSql('DELETE FROM transactions WHERE id = ?', [id]);
      },
      (error) => {
        console.error('Delete transaction error:', error);
        reject(error);
      },
      () => {
        console.log('Transaction deleted successfully');
        resolve();
      }
    );
  });
};

// Account operations
export const getAccounts = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('SELECT * FROM accounts ORDER BY name', [], (_, { rows }) => {
          resolve(rows._array);
        });
      },
      (error) => {
        console.error('Get accounts error:', error);
        reject(error);
      }
    );
  });
};

export const addAccount = (account) => {
  return new Promise((resolve, reject) => {
    const { id, name, balance = 0 } = account;
    
    db.transaction(
      (tx) => {
        tx.executeSql(
          'INSERT INTO accounts (id, name, balance) VALUES (?, ?, ?)',
          [id, name, balance]
        );
      },
      (error) => {
        console.error('Add account error:', error);
        reject(error);
      },
      () => {
        console.log('Account added successfully');
        resolve();
      }
    );
  });
};

export const updateAccountBalance = (id, balance) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'UPDATE accounts SET balance = ? WHERE id = ?',
          [balance, id]
        );
      },
      (error) => {
        console.error('Update account balance error:', error);
        reject(error);
      },
      () => {
        console.log('Account balance updated successfully');
        resolve();
      }
    );
  });
};

// Analytics operations
export const getMonthlyStats = (year, month) => {
  return new Promise((resolve, reject) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    db.transaction(
      (tx) => {
        // Get income
        tx.executeSql(
          `SELECT SUM(amount) as total FROM transactions 
           WHERE type = 'income' AND date >= ? AND date <= ?`,
          [startDate, endDate],
          (_, { rows }) => {
            const income = rows._array[0]?.total || 0;
            
            // Get expenses
            tx.executeSql(
              `SELECT SUM(amount) as total FROM transactions 
               WHERE type = 'expense' AND date >= ? AND date <= ?`,
              [startDate, endDate],
              (_, { rows }) => {
                const expenses = rows._array[0]?.total || 0;
                resolve({
                  income,
                  expenses,
                  savings: income - expenses
                });
              }
            );
          }
        );
      },
      (error) => {
        console.error('Get monthly stats error:', error);
        reject(error);
      }
    );
  });
};

export const getCategoryStats = (year, month) => {
  return new Promise((resolve, reject) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT category, SUM(amount) as total FROM transactions 
           WHERE type = 'expense' AND date >= ? AND date <= ?
           GROUP BY category ORDER BY total DESC`,
          [startDate, endDate],
          (_, { rows }) => {
            resolve(rows._array);
          }
        );
      },
      (error) => {
        console.error('Get category stats error:', error);
        reject(error);
      }
    );
  });
}; 