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
// process.env.REACT_APP_API_BASE_URL = "";

function Root() {
	return (
		<Router basename={process.env.PUBLIC_URL}>
			<App />
		</Router>
	)
}

function App() {
	const storedTheme = localStorage.getItem("theme");
	const [theme, setTheme] = useState(storedTheme || "light");
	// console.log(process.env);

	useEffect(() => {
		localStorage.setItem("theme", theme);
	}, [theme]);


	document.body.style.backgroundColor = theme == "light" ? "rgb(203, 231, 230)" : "rgb(7, 0, 14)";

	const user = useSelector(selectUser);
	const dispatch = useDispatch();

	useEffect(() => {
		fetch(process.env.REACT_APP_API_BASE_URL + "entries", { /*credentials: "include"*/ })
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

		fetch(process.env.REACT_APP_API_BASE_URL + "user", {
			credentials: "include", headers: {
				"SameSite": "None"
			},
		})
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
	let location = useLocation();

	if (location.pathname !== "/")
		scrollBarWidth = 0;
	// console.log(location.path, scrollBarWidth);

	return (
		<div className={`App theme-${theme}`} style={{ "--scrollbar-width": scrollBarWidth + "px" }}>
			<header className="app-header">
				<div className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
					{theme === "light" && <span>☀&nbsp;&nbsp;\&nbsp;&nbsp;☾</span>}
					{theme === "dark" && <span>☼&nbsp;&nbsp;/&nbsp;&nbsp;☪</span>}
				</div>
			</header>

			<TransitionAnimation>
				<Route path="/entry/:id">
					<EntryWrapper theme={theme} />
				</Route>
				<Route path="/">
					<Homepage theme={theme} />
				</Route>
			</TransitionAnimation>

			<footer className={`app-footer ${user !== undefined ? 'visible' : ''}`}>
				{user ?
					<form method="get" action={process.env.REACT_APP_API_BASE_URL + "logout"}>
						{user.username}: <button>logout</button>
					</form>
					: <form method="get" action={process.env.REACT_APP_API_BASE_URL + "auth/github"} >
						<button >Sign in with Github <img src={`icons/GitHub-Mark-${theme === "dark" ? "Light-" : ""}32px.png`} /></button>
					</form>
				}
			</footer>
		</div >
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

export default Root;