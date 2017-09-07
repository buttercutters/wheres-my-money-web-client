import React, { Component } from 'react';
import { auth, provider } from './firebase.js';
import axios from 'axios';
import qs from 'qs';
var PlaidLink = require('react-plaid-link');

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: null,
      transactions: [],
      transactionSums: {}
    };

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleOnSuccess = this.handleOnSuccess.bind(this);
    this.exchangePublicToken = this.exchangePublicToken.bind(this);
    this.getTransactionsFromDatabase = this.getTransactionsFromDatabase.bind(this);
  }

  componentDidMount() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({user});
      }
    });
  }

  login() {
    auth.signInWithPopup(provider)
      .then(result => {
        const user = result.user;
        this.setState({user});
        this.verifyUser();
      });
  }

  verifyUser() {
    auth.currentUser.getIdToken()
      .then(idToken => {
          const config = {
            url: 'http://localhost:5000/testproject-6177f/us-central1/addUser',
            payload: qs.stringify({idToken: idToken})
          };
          axios.post(config.url, config.payload)
            .catch(err => console.log(err));
        });
  }

  handleOnSuccess(token, metadata) {
    // send token to client server
    this.exchangePublicToken(token);
  }

  exchangePublicToken(publicToken) {

    let config = {
      url: 'http://localhost:5000/testproject-6177f/us-central1/exchangePublicToken',
      payload: qs.stringify({
        publicToken: publicToken,
        uniqueUserId: auth.currentUser.uid
      })
    };
    axios.post(config.url, config.payload)
    .then(() => this.getTransactionsFromDatabase())
    .catch(error => { console.log(error);});
  }

  getTransactionsFromDatabase() {
    axios.get('http://localhost:5000/testproject-6177f/us-central1/getTransactionsFromDatabase')
    .then((response) => {
      this.setState({transactions: response.data});
      this.sumTransactions();
    })
    .catch((error) => {
      console.log(error);
    });
  };

  sumTransactions() {
    let transactionSums = {};
    this.state.transactions.forEach((transaction) => {
      if (transactionSums[transaction.date]) {
        transactionSums[transaction.date] += transaction.amount;
      } else {
        transactionSums[transaction.date] = transaction.amount;
      }
    });
    this.setState({transactionSums: transactionSums});
  }

  logout() {
    auth.signOut()
      .then(() => {
        this.setState({user: null});
      });
  }

  render() {
    return (
      <div className='App'>

        <div className='wrapper'>
          {this.state.user ?
            <button onClick={this.logout}>Log Out</button>
          :
          <button onClick={this.login}>Log In</button>
          }
        </div>

        {this.state.user ?
          <div>
            <div>{this.state.user.email}</div>
            <PlaidLink
              publicKey={process.env.REACT_APP_PLAID_PUBLIC_KEY}
              product='connect'
              env='sandbox'
              clientName='Wheres My Money'
              onSuccess={this.handleOnSuccess}
            />
          </div>
        :
        <div>Log in to link account</div>
        }
        <div className='Transactions'>
          {this.state.transactions.map((transaction, idx) => (
            <transaction key={transaction.transaction_id}>{transaction.date + ' | ' + transaction.name + ' - $' + transaction.amount}<br/>
<<<<<<< HEAD
=======
              {this.state.transactions.length-1 === idx || transaction.date !== this.state.transactions[idx+1].date ?
>>>>>>> Dynamically render transactions and total spending per day
                <div>{'Total spent on ' + transaction.date + ' ==> '}<u>{'$' + this.state.transactionSums[transaction.date]}</u><br/><br/></div> :
                <div></div>
              }
            </transaction>
          ))}
        </div>

      </div>
    );
  }
}

export default App;
