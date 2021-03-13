import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';

import "./Homepage.scss";

const data = [
	// { name: "a", tags: ["2d", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
	// { name: "b", tags: ["2d"] },
	{ name: "c", tags: ["2d"] },
	{ name: "d", tags: ["2d"] },
	// { name: "e", tags: ["2d"] },
	// { name: "f", tags: ["2d"] },
	{
		name: "golden ratio sunflower spiral", tags: ["2d"],
		links: [
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
		],
		images: [
			{ src: "/img/sunflower.png" },
			{ src: "/img/download.png" },
			{ src: "/img/Fractal N-Gon 3-10-2021 23_58_00.png" },
		],
	},
	{
		name: "golden ratio sunflower spiral 2", tags: ["2d"],
		links: [
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
		],
		images: [
			{ src: "/img/download.png" },
			{ src: "/img/sunflower.png" },
			{ src: "/img/Fractal N-Gon 3-10-2021 23_58_00.png" },
			{ src: "/img/sunflower.png" },
		],
	},
	{ name: "g", tags: ["2d"] },
	// { name: "h", tags: ["2d"] },
	// { name: "i", tags: ["2d"] },
	// { name: "j", tags: ["2d"] },
	// { name: "k", tags: ["2d"] },
	{
		name: "l-system", tags: ["2d", "3d"], links: [
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtub.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?vvIreKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe4", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" },
			{ url: "https://www.youtube.com/watch?=vIrecKTVe94", descriptor: "tutorial tutorial tutorial tutorial" }
		],
		images: [
			{ src: "/img/Fractal N-Gon 3-10-2021 23_58_00.png" },
			{ src: "/img/download.png" },
			{ src: "/img/sunflower.png" },
		],
		comments: [
			{ timestamp: new Date().getTime(), username: "maxim", comment: "yo!" },
			{ timestamp: new Date().getTime(), username: "maxim", comment: "hey there" },
			{ timestamp: new Date().getTime(), username: "maxim", comment: "cool algorithm!" },
			{ timestamp: new Date().getTime(), username: "maxim", comment: "cool algorithm!" },
		]
	},
	// { name: "m", tags: ["2d"] },
	// { name: "m2", tags: ["2d"] },
	// { name: "o", tags: ["2d"] },
	{
		name: "n-gon fractal", tags: ["2d"], links: [{ url: "https://www.youtube.com/watch?v=vIrecKTVe94", descriptor: "tutorial" }],
		images: [
			{ src: "/img/download.png" },
		],
	},
	// { name: "p", tags: ["2d"] },
	// { name: "q", tags: ["2d"] },
	// { name: "r", tags: ["2d"] },
	// { name: "s", tags: ["2d"] },
	// { name: "t", tags: ["2d"] },
	// { name: "u", tags: ["2d"] },
	// { name: "v", tags: ["2d"] },
	// { name: "w", tags: ["2d"] },
	// { name: "x", tags: ["2d"] },
	// { name: "y", tags: ["2d"] },
	// { name: "z", tags: ["2d"] },
]

const calcCols = () => Math.ceil(window.innerWidth / 500)

export function Homepage() {

	const categories = {};

	const [search, setSearch] = useState("");
	const [openEntry, setOpenEntry] = useState(null);

	const storedTheme = localStorage.getItem("theme");
	const [theme, setTheme] = useState(storedTheme || "light");

	const storedMode = localStorage.getItem("mode");
	const [mode, setMode] = useState(storedMode || "text-image");

	useEffect(() => {
		localStorage.setItem("theme", theme);
	}, [theme]);

	useEffect(() => {
		localStorage.setItem("mode", mode);
	}, [mode]);

	const rankedData = data.map((entry, i) => {
		const blob = entry.name
			+ (entry.tags || []).reduce((tot, tag) => tot + tag, "")
			+ (entry.links || []).reduce((tot, link) => tot + link.url + link.descriptor, "").toLocaleLowerCase()
		const rank = search.split(" ").reduce((tot, s) => tot + (blob.match(s.toLocaleLowerCase()) ? 1 : 0), 0)
		const id = entry.name;
		const links = (entry.links || []).map(l => ({ ...l, id: l.url }));
		return { ...entry, links, rank, id };
	}).sort((e1, e2) => e2.rank - e1.rank);

	const filteredData = rankedData.filter((entry) => entry.rank > 0 && (mode != "image" || entry?.images?.length > 0));

	if (filteredData.length == 1 && openEntry?.id != filteredData[0].id)
		setOpenEntry(filteredData[0]);

	filteredData.forEach(entry => {
		const cat = entry.name[0];
		categories[cat] = [...(categories[cat] || []), entry];
	});

	// filteredData.forEach(entry => {
	// 	entry.tags.forEach(tag => {
	// 		const cat = tag;
	// 		categories[cat] = [...(categories[cat] || []), entry];
	// 	});
	// });
	const [cols, setCols] = useState(calcCols());

	useEffect(() => {
		const callback = () => setCols(calcCols());
		window.addEventListener('resize', callback)
		return () => window.removeEventListener('resize', callback);
	});

	const cats = Object.entries(categories);
	const n = cats.length;
	const columns = [];
	for (let i = 0; i < cols && cats.length; i++)
		columns[i] = cats.splice(0, Math.ceil((1 / cols) * n));

	return (
		<div id="homepage" className={`mode-${mode} theme-${theme}`}>
			<header className="header">
				<h1>Creative Coding Codex</h1><br />
				<div className="settings-bar">
					<input tabIndex={0} className="search-bar" type="text" placeholder="search..." onChange={(evt) => { setSearch(evt.target.value); setOpenEntry(null) }}></input>
					<div className="mode-select">
						<button tabIndex={1} className={`text-btn ${mode == 'text' ? 'selected' : ''}`} onClick={() => setMode('text')}>text</button>
						<button tabIndex={2} className={`text-images-btn ${mode == 'text-image' ? 'selected' : ''}`} onClick={() => setMode('text-image')}>text & images</button>
						<button tabIndex={3} className={`images-btn ${mode == 'image' ? 'selected' : ''}`} onClick={() => setMode('image')}>images</button>
					</div>
				</div>

				<div className="theme-toggle" onClick={() => setTheme(theme == "light" ? "dark" : "light")}>
					{theme == "light" && <span>☀&nbsp;&nbsp;\&nbsp;&nbsp;☾</span>}
					{theme == "dark" && <span>☼&nbsp;&nbsp;/&nbsp;&nbsp;☪</span>}
				</div>
			</header>
			<div className="entries">
				{columns.map((column, i) =>
					<Column key={i} column={column} openEntry={openEntry} setOpenEntry={setOpenEntry} cols={columns.length} mode={mode} />
				)}
			</div>
			<footer className="footer">
			</footer>
		</ div >
	);
}

function Column({ column, openEntry, setOpenEntry, cols, mode }) {
	return (
		<div className="column" style={{ width: (100 / cols) + "%" }}>
			{column.map(([cat, entries]) =>
				<div key={cat} className="category">
					{mode != "image" && <h2>{cat}</h2>}
					<div>
						{entries.map(entry => {
							const open = openEntry && entry.id == openEntry.id;
							return (
								<Entry key={entry.id} entry={entry} open={open} onClick={() => setOpenEntry(entry)} onClose={(evt) => { setOpenEntry(null); evt.stopPropagation(); }} mode={mode} />
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

function Entry({ entry, open, onClick, onClose, mode }) {
	const { name, links, images, comments, id } = entry;

	const hasImages = (images || []).length > 0;
	const hasComments = (comments || []).length > 0;

	const [openHeight, setOpenHeight] = useState(0
		//		+ (links || []).length * 18
		//	+ (mode == "text-image" && hasImages ? 150 + 14 : 0)
	);
	const { ref } = useResizeDetector({
		onResize: (w, h) => {
			setOpenHeight(h);
			// setOpenHeight(Math.max(openHeight, h));
		}
	});
	let { height: titleHeight, ref: titleRef } = useResizeDetector();
	let { height: headerHeight, ref: headerRef } = useResizeDetector();

	// if (hasImages)
	// 	titleHeight = "150";

	const [starred, setStarred] = useState(false);

	const getStoredStarredEntries = () => {
		let ret;
		try {
			ret = JSON.parse(localStorage.getItem("starredEntries"));
		} catch { }
		return ret || [];
	}

	useEffect(() => {
		const starredEntries = getStoredStarredEntries();
		if (starredEntries.includes(id))
			setStarred(true);
	}, []);

	const onStar = () => {
		let starredEntries = getStoredStarredEntries();
		if (starred) {
			starredEntries = starredEntries.filter(e => e != id);
			setStarred(false);
		} else {
			starredEntries.push(id);
			setStarred(true);
		}
		localStorage.setItem("starredEntries", JSON.stringify(starredEntries));
	}

	const hasPreviewImage = mode.match("image") && hasImages;

	return (
		<div
			className={`entry ${open ? 'open' : ''} mode-${mode}`}
			style={{ height: open ? openHeight + headerHeight + 30 : headerHeight }}
		>
			<div style={{ width: "100%" }}>
				<div className="entry-header" ref={headerRef} onClick={onClick}>
					{<div className="title-container" style={{ height: titleHeight }}><h3 className={`${hasPreviewImage ? '' : 'no-preview-image'} ${starred ? 'starred' : ''}`} ref={titleRef}>
						{open && <div className="arrow" onClick={onClose}>➳</div>}
						{open && <div className="star" onClick={() => onStar()}>{starred ? "✦" : "✧"}</div>}
						{name}
					</h3></div>}
					{hasPreviewImage &&
						<img className="preview-image" src={images[0].src} />
					}
				</div>
				<div className="body" ref={ref} >
					<div className="resources-container">
						<ul>
							{(links || []).map((link, i) =>
								<li key={i}>
									<Link link={link} />
								</li>
							)}
						</ul>
						<a className="url internal">resources: ({(links || []).length})</a>
					</div>

					{hasImages &&
						<div className="images-container">
							{/* <h5>images:</h5> */}
							<div className="images">
								{(images.slice(mode == "image" ? 1 : 0, mode == "image" ? 4 : 3)).map((img, i) =>
									<img src={img.src} key={i} />
								)}
							</div>
							<a className="url internal">images: ({images.length})</a>
						</div>
					}
					{hasComments &&
						<div className="comments-container">
							<div className="comments">
								{(comments.slice(0, 3)).map(({ timestamp, username, comment }) =>
									<div className="comment" key={timestamp + comment}>
										<span className="timestamp">{new Date(timestamp).toLocaleDateString()}: </span>

										<span className="username">{username}: </span>
										{comment}</div>
								)}
							</div>
							<a className="url internal">comments: ({comments.length})</a>
						</div>
					}
					{/* <div className="divider" /> */}
				</div>
			</div>
		</div >
	)
}

function Link({ link: { descriptor, url } }) {
	return (
		<div className="link">
			<h4><span className="star-container">
				<div className="star">✧</div>
				{descriptor}:
				</span> <a href={url} target="_blank" className="url">{url}</a>
			</h4>
		</div>
	);
}