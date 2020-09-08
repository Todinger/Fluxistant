socket = io();
socket.on('userImageList', userList => {
	existingUserFiles = userList;
	loadUserImages();
	if (!running) {
		running = true;
		updateUsers();
		setInterval(updateUsers, UPDATE_INTERVAL);
	}
});

socket.emit('getUserImageList');
