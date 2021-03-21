import React, { useState, useEffect } from 'react';
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link,
	useParams,
	useLocation
} from "react-router-dom";

import {
	TransitionGroup,
	CSSTransition
} from "react-transition-group";

import { useSelector, useDispatch } from 'react-redux';
import { useScrollbarSize } from 'react-scrollbar-size';

import { Homepage } from './features/homepage/Homepage';
import { Entry } from './features/entry/Entry';
import { selectEntries, setEntries } from "./features/homepage/entriesSlice";
import { selectUser, setUser } from "./features/homepage/userSlice";

import './App.scss';

const API_BASE_URL = "http://127.0.0.1:3001/"

function App() {
	const storedTheme = localStorage.getItem("theme");
	const [theme, setTheme] = useState(storedTheme || "light");

	useEffect(() => {
		localStorage.setItem("theme", theme);
	}, [theme]);


	const user = useSelector(selectUser);
	const dispatch = useDispatch();

	useEffect(() => {
		fetch(API_BASE_URL + "entries", { /*credentials: "include"*/ })
			.then((res) => {
				console.log(res);
				if (res.ok)
					return res.json().then(json => {
						console.log("json", json);
						dispatch(setEntries(json));
					})
			}).catch((error) => {
				// alert(error);
				console.error(error);
			});

		fetch(API_BASE_URL + "user", { credentials: "include" })
			.then((res) => {
				console.log(res);
				if (res.ok)
					return res.json().then(json => {
						console.log("json", json);
						dispatch(setUser(json.user));
					})

				dispatch(setUser(null));
			})
			.catch((error) => {
				console.error(error);
				dispatch(setUser(null));
			});

	}, [dispatch]);

	let { width: scrollBarWidth } = useScrollbarSize();

	return (
		<div className={`App theme-${theme}`}>
			<div className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
				{theme === "light" && <span>☀&nbsp;&nbsp;\&nbsp;&nbsp;☾</span>}
				{theme === "dark" && <span>☼&nbsp;&nbsp;/&nbsp;&nbsp;☪</span>}
			</div>

			<Router>
				<TransitionAnimation>
					<Route path="/entry/:id">
						<EntryWrapper theme={theme} />
					</Route>
					<Route path="/">
						<Homepage theme={theme} />
					</Route>
				</TransitionAnimation>
			</Router>

			<footer className={`footer ${user !== undefined ? 'visible' : ''}`} style={{ "margin-right": scrollBarWidth }}>
				{user ?
					<form method="get" action={API_BASE_URL + "logout"}>
						{user.username}: <button >logout</button>
					</form>
					: <form method="get" action={API_BASE_URL + "auth/github"}>
						<button >Sign in with Github <img src={`./icons/GitHub-Mark-${theme === "dark" ? "Light-" : ""}32px.png`} /></button>
					</form>
				}
			</footer>
		</div>
	);
}

function TransitionAnimation({ children }) {
	let location = useLocation();
	// console.log(location);
	const isIn = location.pathname == "/"
	return (
		<TransitionGroup
			component={null}
		>
			<CSSTransition
				key={location.key}
				classNames={`transition-${isIn ? 'down' : 'down'}`}
				timeout={500}
				in={isIn}
			>
				<Switch location={location}>
					{children}
				</Switch>
			</CSSTransition>
		</TransitionGroup>
	);
}

function EntryWrapper({ theme }) {

	let { id } = useParams();
	const entries = useSelector(selectEntries);

	const entry = entries.find(e => e._id == id);
	if (entry)
		return (
			<Entry entry={entry} theme={theme} />
		);
	return null;
}

export default App;