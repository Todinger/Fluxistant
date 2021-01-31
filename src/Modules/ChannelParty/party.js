const FETCH_USERS_URL = 'https://tmi.twitch.tv/group/user/fluxistence/chatters';
// const CORS_PROXY_URL = "http://localhost:8080/";
const CORS_PROXY_URL = "https://cors-anywhere.herokuapp.com/";
const USER_IMAGE_DIR = '../../Images/User-Specific/';
const USER_LIST_FILE = USER_IMAGE_DIR + '_Users.txt';
const GLOW_SIZE = 15;
const GLOW_COLOR = '#ffffcc';
const UPDATE_INTERVAL = 1000;

// var existingUserFiles = [
// 	"ann_marie1.png",
// 	"Ann_Marie33.png",
// 	"ciandal206.png",
// 	"enligh10d.png",
// 	"fluxistence.png",
// 	"fluxlingkitten.png",
// 	"iamlarcyn.png",
// 	"maaz28.png",
// 	"maxadrums.png",
// 	"MilanTheNerd.png",
// 	"neolycan.png",
// 	"omreeny.png",
// 	"Puma008.png",
// 	"steampunk_monk.png",
// 	"st_august.png",
// 	"therealxagent.png",
// 	"yecatsmailbox.png",
// ];

var currentUsers = [];
var currentUserImagePaths = {};
var currentUserImages = {};

function getSubKeys(obj1, obj2) {
	var k1 = Object.keys(obj1);
	return k1.filter(function(x) {
		return obj2[x] === undefined;
	});
}

function readTextFile(file, onResult)
{
	$.get(file, onResult);
}

function readFileLines(file, onResult) {
	readTextFile(file, function(results) {
		onResult(result.split('\n'));
	});
}

// (function loadSupportedUserNames() {
// 	readFileLines(USER_LIST_FILE, function(names) {
// 		existingUserFiles = names.filter(name => name.length > 0);
// 	});
// })();

function userFileExists(userFile) {
	// STUPID JAVASCRIPT CANNOT DO THIS >_<
	// I KNOW IT'S FOR SECURITY REASONS BUT I'M STILL UPSET >_<
	// So I'm forced to generate a list externally and keep it updated
	return existingUserFiles.includes(userFile);
}

function addImage(name, src) {
	var sz = GLOW_SIZE.toString();
	var shadowfilter = `drop-shadow(0px 0px ${sz}px ${GLOW_COLOR})`;
	
	return $(`<div id="img_${name}" class="x"><img class="inner shadowfilter y" src="${src}"></div>`)
	.css("-webkit-filter", shadowfilter)
	.css("filter", shadowfilter)
	.fadeIn(100)
	.appendTo('#imageholder');
}

function updateUserImages(newUsers) {
	// console.log('New users:'); console.log(newUsers);
	let newUserImagePaths = {};
	let newUserImages = {};
	
	// console.log('New users Images:'); console.log(newUserImages);
	newUsers.forEach(user => {
		let fileName = user + '.png';
		let filePath = USER_IMAGE_DIR + user + '.png';
		if (userFileExists(fileName)) {
			newUserImagePaths[user] = USER_IMAGE_DIR + fileName;
		}
	});
	
	let usersToRemove = getSubKeys(currentUserImagePaths, newUserImagePaths);
	let usersToAdd = getSubKeys(newUserImagePaths, currentUserImagePaths);
	
	// console.log('To remove:'); console.log(usersToRemove);
	usersToRemove.forEach(user => {
		currentUserImages[user]
		.fadeOut(100, function() { $(this).remove(); });
	});
	
	// console.log('To add:'); console.log(usersToAdd);
	usersToAdd.forEach(user => {
		newUserImages[user] = addImage(user, newUserImagePaths[user]);
	});
	
	currentUserImagePaths = newUserImagePaths;
	currentUserImages = newUserImages;
}

function updateUsers() {
	doCORSGet(FETCH_USERS_URL, function(data) {
		chattersData = JSON.parse(data);
		let newUsers = [];
		Object.values(chattersData.chatters).forEach(
			groupUsers => newUsers.push(...groupUsers));
		updateUserImages(newUsers);
	});
}

setInterval(updateUsers, UPDATE_INTERVAL);
