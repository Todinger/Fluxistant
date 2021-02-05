$.insertAtIndex = function(jContainer, index, jValue) {
	if (index === 0) {
		jContainer.prepend(jValue);
	} else {
	
	}
	
	jContainer.find("> :nth-child(" + (index) + ")").after(jValue);
}
