import firebase from 'firebase';

const firebaseConfig = {
    apiKey: "AIzaSyAM_2cfUP2u2pv55y_WgfnXrzO16l4RtVQ",
    authDomain: "coup-c4862.firebaseapp.com",
    databaseURL: "https://coup-c4862.firebaseio.com",
    projectId: "coup-c4862",
    storageBucket: "coup-c4862.appspot.com",
    messagingSenderId: "1018352808422",
    appId: "1:1018352808422:web:e597c6b7985c0a39e52627",
    measurementId: "G-MDTYYPRVDF"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    console.error(error);
});
firebase.analytics();

// var firebaseConfig = {
//     apiKey: "AIzaSyC5RhHMBsCsL8rnSJeDHha73_tayMsHHbQ",
//     authDomain: "couptest-5ae50.firebaseapp.com",
//     databaseURL: "https://couptest-5ae50.firebaseio.com",
//     projectId: "couptest-5ae50",
//     storageBucket: "couptest-5ae50.appspot.com",
//     messagingSenderId: "407017607899",
//     appId: "1:407017607899:web:3890f855bef489e6ab72fe",
//     measurementId: "G-8TMJ6V73P8"
//   };
//   firebase.auth().signInAnonymously().catch(function(error) {
//         // Handle Errors here.
//         console.error(error);
//     });
//   // Initialize Firebase
//   firebase.initializeApp(firebaseConfig);
//   firebase.analytics();

export const firestore = firebase.firestore();
// TODO: firestore room deletion still keeps data when same room name is reused
// firestore.enablePersistence(false);

export const root = "root";
