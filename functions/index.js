const functions = require('firebase-functions');
const admin = require('firebase-admin');
const plaid = require('plaid');
const dotenv = require('dotenv');
const moment = require('moment');
dotenv.config();

var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
});

exports.exchangePublicToken = functions.https.onRequest((request, response) => {
  response.header('Access-Control-Allow-Origin', '*');
  const publicToken = request.body.publicToken;
  const plaidClient = new plaid.Client(
    process.env.REACT_APP_PLAID_CLIENT_ID,
    process.env.REACT_APP_PLAID_SECRET,
    process.env.REACT_APP_PLAID_PUBLIC_KEY,
    plaid.environments.sandbox);

  plaidClient.exchangePublicToken(publicToken)
    .then((successResponse) => {

      let item_id = successResponse.item_id;
      let access_token = successResponse.access_token;
      let request_id = successResponse.request_id;

      let payload = {item_id: item_id,
        access_token: access_token,
        request_id: request_id};

      admin.database()
      .ref('/users' + '/ni6laljDCHdTIZYA2hSrKfxfvWw2' + '/access_tokens' )
      .set(payload)
      .then(() => {
        response.end();
      });


    }).catch((error) => {
      console.log(error);
    });
});

exports.getTransactionsFromPlaid = functions.https.onRequest((request, response) => {
  response.header('Access-Control-Allow-Origin', '*');
  const access_token = 'access-sandbox-0228c2e2-755b-4137-b1ad-7f52300b5635';
  const plaidClient = new plaid.Client(
    process.env.REACT_APP_PLAID_CLIENT_ID,
    process.env.REACT_APP_PLAID_SECRET,
    process.env.REACT_APP_PLAID_PUBLIC_KEY,
    plaid.environments.sandbox);

  const now = moment();
  const today = now.format('YYYY-MM-DD');
  const thirtyDaysAgo = now.subtract(30, 'days').format('YYYY-MM-DD');

  plaidClient.getTransactions(access_token, thirtyDaysAgo, today)
    .then((successResponse) => {

      let item_id = successResponse.item.item_id;
      let accounts = successResponse.accounts;
      let request_id = successResponse.request_id;
      let transactions = successResponse.transactions;

      const ref = admin.database().ref('users');

      ref.once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var childKey = childSnapshot.key;
          var childData = childSnapshot.val();
          console.log(childKey);
          console.log(childData.item_id);
          console.log(item_id);
          console.log(childData.item_id === item_id);

          admin.database()
          .ref(`users/ni6laljDCHdTIZYA2hSrKfxfvWw2/access_tokens/access_token/${item_id}`)
          .set({transactions: transactions})
          .then(() => {
            response.end();
          });
        });
      });

      response.end();

    }).catch((error) => {
      console.log(error);
    });
});

exports.getTransactionsFromDatabase = functions.https.onRequest((request, response) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.send('transactions will go here');
});

exports.addUser = functions.https.onRequest((request, response) => {
  response.header('Access-Control-Allow-Origin', '*');
  const idToken = request.body.idToken;

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      let uid = decodedToken.uid;
      admin.auth().getUser(uid)
        .then(userRecord => {
          let user = userRecord.toJSON();

          admin.database().ref('users/' + uid).set({
            email: user.email,
            name: user.displayName
          });
        })
        .catch(error => {
          console.log("Error fetching user data:", error);
        });
    });
  response.end();
});
