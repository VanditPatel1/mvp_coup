import {firestore, root} from "../config/firebase";
import {handleDBException} from "./callbacks";
import firebase from 'firebase';
import React, {useContext, useEffect, useState} from 'react';
import { Modal, Button, Col, Row, Container } from 'react-bootstrap';
import { incrementTurn, Move } from './move_logic';
import PlayCard from '../components/PlayCard.js';
import '../styles/Card.css';



function exchangeOneCard(roomName, playerID, card){
	firestore.collection(root).doc(roomName).get().then((room)=>{
		let allCards = room.data().cards;
		let topCard = allCards[0];
		allCards.shift();
		allCards.push(card);
		firestore.collection(root).doc(roomName).update({
			cards: allCards
		}).then(()=>{
			firestore.collection(root).doc(roomName).collection("players").doc(playerID).get().then((player)=>{
				let playerCards = [...player.data().cards];
				playerCards.splice(card, 1);
				playerCards.push(topCard);
				firestore.collection(root).doc(roomName).collection("players").doc(playerID).update({
					cards: playerCards
				});
			})
		})

	})

}

function updateCardDeck(cards, chosenKeys, oldCards){
	for(let i=0; i<cards.length;i++){
		if(!chosenKeys.has(cards[i][1])){
			oldCards.push(cards[i][0]);
		}
	}
	return oldCards;
}

export async function HasCard(roomName, playerID, move){
	let result = false;
	let card = ""
	await firestore.collection(root).doc(roomName).collection("players").doc(playerID).get().then((player)=>{
		let cardSet = new Set();
		player.data().cards.forEach(card => cardSet.add(card));
		console.log(cardSet);
		console.log("Checking: " + move);
		switch (move) {
			case "foreign_aid":
			case "duke":
				result = cardSet.has("Duke");
				if (result){
					card = "Duke"
				}
				break;
			case "exchange_cards":
				result = cardSet.has("Ambassador");
				if (result){
					card = "Ambassador"
				}
				break;
			case "assassinate":
				result = cardSet.has("Assassin");
				if (result){
					card = "Assassin"
				}
				break;
			case "steal":
				result = cardSet.has("Captain");
				if (result){
					card = "Captain";
				}
				break;
			default:
				alert("Invalid move type");
				break;
		}
	});
	console.log("Result: " + result);
	if (result){
		exchangeOneCard(roomName, playerID, card);
	}
	return result;
}
export function generalIncome(roomName, playerID){
	firestore.collection(root).doc(roomName).collection("players").doc(playerID).update({
		coins: firebase.firestore.FieldValue.increment(1)
		});
} 

export function Coup(roomName, playerID, playerList, playerIndex, turn){
	let newPlayerList = [...playerList];
	newPlayerList.splice(playerIndex, 1);

	const handlePlayerClick = (playerChosen) =>{
		return async () => {
			console.log(playerChosen);
			firestore.collection(root).doc(roomName).collection("turns").doc(turn.toString()).get().then(async (turn)=>{
				let oldMove = turn.data().move
				const newMove = Move(oldMove.type, oldMove.player, playerChosen);
				await firestore.collection(root).doc(roomName).collection("turns").doc(turn.id.toString()).update({
					move: newMove
					});
				}
			)
		}
	}

	return (
		<div>
			<h3>Choose a player to Coup!</h3>
			<ul>
				{newPlayerList.map(player =>(
					<div style ={{paddingBottom: "1em", paddingTop: "1em"}}>
						<button type="button" className="btn btn-lg btn-danger" key = {player} style = {{width:"20em"}} 
						onClick = {handlePlayerClick(player)}> {player} </button>
					</div>))}
			</ul>
		</div>)
}

export function foreignAid(roomName, playerID){
	firestore.collection(root).doc(roomName).collection("players").doc(playerID).update({
		coins: firebase.firestore.FieldValue.increment(2)
		})
}

export function Duke(roomName, playerID){
	firestore.collection(root).doc(roomName).collection("players").doc(playerID).update({
		coins: firebase.firestore.FieldValue.increment(3)
		})
}

export function LoseCard(props){
	const [cards, setCards] = useState([]);
	const [isDisabled, setDisabled] = useState(false);
	const [chosenKeys, setChosenKeys] = useState(new Set());
	const [cardDeck, setCardDeck] = useState([]);
	let cardsToChoose = 1;

	useEffect(()=>{
		const subscribe = firestore.collection(root).doc(props.roomName).collection("players").doc(props.playerID).get().then((player)=>{
			let viewCards = [];
			if (player.data().cards.length >1){
				viewCards.push([player.data().cards[0], 1], [player.data().cards[1], 2]);
			} else{
				viewCards.push([player.data().cards[0], 1]);
			}
			setCards(viewCards);
			firestore.collection(root).doc(props.roomName).get().then((room) =>{
				let allCards = room.data().cards;
				setCardDeck(allCards);
			})
		});
		return () => subscribe;
	}, []);

	const handleClick = () => {
		return async () => {
			setDisabled(true);
			let chosenCards = [];
			cards.forEach(card => {
				if(!chosenKeys.has(card[1])) chosenCards.push(card[0]);
			});

			await firestore.collection(root).doc(props.roomName).collection("players").doc(props.playerID).update({
				cards: chosenCards
			});
			const updatedCards = updateCardDeck(cards, chosenKeys, cardDeck);
			await firestore.collection(root).doc(props.roomName).update({
				cards: updatedCards
			}).then(() => {
				props.confirmFunction();
			});
		}
	}

	const selectCard = (card) => {
		return async() =>{
			if(chosenKeys.has(card[1])){
				chosenKeys.delete(card[1]);
			}else{
				if(chosenKeys.size === cardsToChoose){
					const iterator1 = chosenKeys.values();
					chosenKeys.delete(iterator1.next().value);
				}
				chosenKeys.add(card[1]);
			}
			setChosenKeys(new Set(chosenKeys));
		}
	}

	return (
		<div>
		<h3 style={{paddingBottom: "5%"}}>{props.title}</h3>
		<Container style={{paddingBottom: "5%"}}>
			<Row>
				{cards.map(card =>{
					return(
					<Col>
						<div className={chosenKeys.has(card[1]) ? "Selected" : "Highlight"} onClick = {selectCard(card)} style={{display:"inline-block"}}>
							<PlayCard cardName={card[0]} />
						</div>
					</Col>
					);
					})}
			</Row>
		</Container>
		<button type="button" className="btn btn-lg btn-success" style = {{width:"20em"}} 
					 	disabled = {isDisabled || cardsToChoose!==chosenKeys.size} 	onClick = {handleClick()}>Confirm</button>
		</div>
		)
}

export function Ambassador(roomName, playerID){
	const [cards, setCards] = useState([]);
	const [cardDeck, setCardDeck] = useState([]);
	const [isDisabled, setDisabled] = useState(false);
	const [cardsToChoose, setCardsToChoose] = useState(0);
	const [chosenKeys, setChosenKeys] = useState(new Set());
	//let chosenKeys = new Set();

	useEffect(()=>{
		const subscribe = firestore.collection(root).doc(roomName).get().then((room) => {
			let viewCards = [];
			viewCards.push([room.data().cards[0], 1], [room.data().cards[1], 2]);
			let allCards = room.data().cards;
			allCards.shift();
			allCards.shift();
			setCardDeck(allCards);

			firestore.collection(root).doc(roomName).collection("players").doc(playerID).get().then((player)=>{
				if (player.data().cards.length >1){
					setCardsToChoose(2);
					viewCards.push([player.data().cards[0], 3], [player.data().cards[1], 4]);
				} else{
					setCardsToChoose(1);
					viewCards.push([player.data().cards[0], 3]);
				}
				setCards(viewCards);
			});
		});
		return () => subscribe;
	}, []);

	const handleClick = () => {
		return async () => {
			setDisabled(true);
			let chosenCards = [];
			cards.forEach(card => {
				if(chosenKeys.has(card[1])) chosenCards.push(card[0]);
			});

			await firestore.collection(root).doc(roomName).collection("players").doc(playerID).update({
				cards: chosenCards
			});
			const updatedCards = updateCardDeck(cards, chosenKeys, cardDeck);
			await firestore.collection(root).doc(roomName).update({
				cards: updatedCards
			});
			await incrementTurn(roomName);		
		}
	}

	const selectCard = (card) => {
		return async() =>{
			if(chosenKeys.has(card[1])){
				chosenKeys.delete(card[1]);
			}else{
				if(chosenKeys.size === cardsToChoose){
					const iterator1 = chosenKeys.values();
					chosenKeys.delete(iterator1.next().value);
				}
				chosenKeys.add(card[1]);
			}
			setChosenKeys(new Set(chosenKeys));
		}
	}

	return (
		<div>
		<h3 style={{paddingBottom: "5%"}}>Choose {cardsToChoose}</h3>
		<Container style={{paddingBottom: "5%"}}>
			<Row>
				{cards.map(card =>{
					return(
					<Col>
						<div className={chosenKeys.has(card[1]) ? "Selected" : "Highlight"} onClick = {selectCard(card)} style={{display:"inline-block"}}>
							<PlayCard cardName={card[0]} />
						</div>
					</Col>
					);
					})}
			</Row>
		</Container>
		<button type="button" className="btn btn-lg btn-success" style = {{width:"20em"}} 
					 	disabled = {isDisabled || cardsToChoose!==chosenKeys.size} 	onClick = {handleClick()}>Confirm</button>
		</div>
		)
}

export function AttemptAssassin(roomName, playerID, playerList, playerIndex, turn){
	let newPlayerList = [...playerList];
	newPlayerList.splice(playerIndex, 1);

	const handlePlayerClick = (playerChosen) =>{
		return async () => {
			console.log(playerChosen);
			firestore.collection(root).doc(roomName).collection("turns").doc(turn.toString()).get().then(async (turn)=>{
				let oldMove = turn.data().move
				const newMove = Move(oldMove.type, oldMove.player, playerChosen);
				await firestore.collection(root).doc(roomName).collection("turns").doc(turn.id.toString()).update({
					move: newMove
					});
				}
			)
		}
	}

	return (
		<div>
			<h3>Choose a player to assasinate!</h3>
			<ul>
				{newPlayerList.map(player =>(
					<div style ={{paddingBottom: "1em", paddingTop: "1em"}}>
						<button type="button" className="btn btn-lg btn-dark" key = {player} style = {{width:"20em"}} 
						onClick = {handlePlayerClick(player)}> {player} </button>
					</div>))}
			</ul>
		</div>)
}