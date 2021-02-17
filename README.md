# Fluxistant
My very own Twitch bot to spice things up on my channel!
It can do a variety of things, and is still in active development.
This bot works in tandem with the StreamElements bot to provide new types of functionality that aren't available through
StreamElements exclusively.


## Features
Most of the bot's functionality is present in modules.
First I'll list what features the bot has which the modules can use, and then I'll list the current modules that the bot
has.


### Basic Features
These are the general features that the bot has:
- **Twitch Integration**:
  - Reading/writing chat messages
  - Recognizing users joining / leaving the chat
  - Recognizing channel point redemptions that are redeemed with a message
  - Commands:
    - Static registration of commands by name
    - Dynamic invocation of commands by modules (lets a module decide if it recognizes a command in a message, rather
      than saying what it is in advance)
    - Configurable command character (default: `!`)
    - User filters for commands: specific user(s), mod-only, sub-only
    - Command response messages with contextual variables
    - SE loyalty point costs
- **StreamElements Integration**:
  - Send messages as the StreamElements bot
  - Read/change StreamElements loyalty points for users
- **CLI**: Command-line interface that can read commands (currently only exit command added)
- **Database Logging**: Uses MongoDB to log important information (currently mostly SE point usage)
- **Key Hooks**: Allows registration of hotkeys and/or firing events upon key up/down
- **Configuration GUI**
  - Allows configuring the bot itself as well as each module through a web interface
  - It's still in the making (that's what I'm working on right now), so not all features are present, but it can already
    configure most things, including commands
  - Possible future extension: showing a window with the configuration page, thus eliminating the need to use an
    external browser


### Modules
Each module may run code on the server and/on a web page that connects to its server code.
For modules that have client web pages, you can add a browser source on OBS set to `http://localhost:3333/mods/<webname>/<source>`
(where `<webname>` and `<source>` are as defined in the module constructor) to show it.
There is a special module called **ScriptedModules** which aggregates the web clients of multiple other modules. For most
things, it's enough to include the module's web client in ScriptedModules in order to use it on OBS.
More on that on the ScriptedModules section.

Notes: 
- All "data files" described here are currently in the process of moving from the module directories into the user's
own folders, in order to support configuration and changes by users. Once I'm done with moving the data files to their
configurable state I will describe their structure here in detail.
- All the commands described under "**Commands**" titles are configurable. You can set their names, aliases, costs in
StreamElements loyalty points and filters for which users may use them. Therefore, the commands shown in the lists only
use default names.


#### Adventure
Lets users have a text adventure together.

An adventure starts when a user enters the starting command: `!adventure`
They're entered into a group of "adventurers" who are embarking upon this adventure, and a recruitment phase begins.

During this phase, other users can use !join to join the adventure.
There is a minimum number of participants, which is configurable (default: 2).
Failure to meet this amount results in the adventure being cancelled when the recruitment phase is over.

The recruitment phase lasts for a configurable amount of time (default: 1 minute).
Once it's over, assuming enough people entered, a random adventure is
selected from the collection of data files in a subfolder in the script's directory
(each file is a category of adventures which can be disabled by setting its
`active` property to false in the JSON file).

Once the adventure begins, a winner is selected from the participants.
The adventure is sent to the chat by the bot one part at a time, with a pause
of a configurable duration (default: 5 seconds) between them.
Once the final part is sent the winner is a configurable amount of StreamElements loyalty points (default: 500).

Another adventure can start afterwards, but there can't be two of them active at the same time.

##### Commands:
- `!adventure` / `!adv`: Starts the adventure by the user.
- `!join`: Joins the currently active adventure.
- `!endadventure`: Cancels the currently ongoing adventure.


#### Bot Fight
Prints scripted "arguments" between us and StreamElements to the chat occasionally.

These conversations are defined by a data file in the module's folder.
They support a high amount of configurability and defaults in order to make writing them both easy and detailed.
This module has been deemed too invasive in the channel chat though, so it is not recommended using it at this time
without changing the current conversation data.

##### Commands:
- `!botfight`: Initiates a random conversation.


#### Branching Adventure
Lets users have a personal text adventure with branching choices.
Each time the user is shown a "chapter", possibly with a choice to make.
The user enters their choice, which causes the story to advance to another chapter as defined in the adventure data
file.

An adventure starts when a user enters the starting command (default: `!choose`).
There is a limited amount of time for the user to enter their choices for every chapter, after which the adventure is
forcibly ended by the bot (it will send reminders to the player at fixed intervals).
Once a winning or losing chapter is reached, it is displayed and then the adventure ends and points are granted or
deducted based on the result.
	
A user can only have one branching adventure running at a time, but there can be branching adventures running for
multiple users concurrently.
Once a user finishes an adventure they can start a new one.
	
A user may cancel their own adventure if they wish (default: `!chickenout`).

##### Commands:
- `!choose`: Starts a choose-your-own branching, solo adventure for the user.
- `!chickenout`: Cancels the user's currently ongoing branching adventure.


#### Candy Game
Adds a "Candy Game" to the stream which can be started either freely by specific people or by anyone through a channel
reward redemption.
During the game, people can use the candy drop command (default: `!gimme`), to have the bot choose a random candy from
the candy database and drop a shower of them on its client web page.
Using the command costs some StreamElements loyalty points (default: 50), and each type of candy has its own value of
points it grants the player for getting it.
Most candy have the same fixed, positive value, with three exceptions:
1. A "bust" candy which deducts points instead of giving them.
2. A personal user-specific candy which grants its "owner" extra points.
3. The "winning" candy which grants a large amount of points and ends the game.
When a player gets the winning candy, their name is displayed on the text display client web page with a Halloween-ish
effect.

The winning candy has a low chance of being found at first (well, the same chance as everything else, but there are a
lot of candy options so it's a small chance), but every time someone drops a candy that chance increases.
This is to ensure that the game becomes easy to end after a while.

The chances are decided by a "weight" value given to each type of candy (default: 25), and the weight of the winning
candy is inflated based on the number of candies that have been dropped so far via an inflation function (default:
linear inflation with increments of 5).
The inflation is configurable through the configuration GUI.

Note: I've been saying "winning candy" in singular form until now, but in actuality there can be more than one winning
candy.
Set `winning` to `true` in the data for a specific candy to make it a winning one.
All winning candy weights are inflated in the same way, but you can change their starting weights to be different.

##### Commands:
- `!trickortreat`: Starts a candy game.
- `!nomorecandy`: Stops the currently ongoing candy game.
- `!gimme`: Randomly chooses a piece of candy for the user and drops it down from above.


#### Censor
Shows pre-configured images on the screen (via its web client) meant to hide various areas in order to censor sensitive
information from the stream. The censorship images can be toggled with shortcut keys.
Currently, the images and key combinations are hard-coded, pending on transition into the new configuration system.


#### Channel Party
Upon command (default: `!hype`) shows a "party" screen. This screen has five levels (soon to be configurable), each with
its own background image and music.
While this screen is shown, the self-images (see Self Commands module) of all the users currently present in the chat
show on the screen and bounce around with the background image showing and the background music playing.
Using the command again increases the level. The speed in which the images move increases accordingly. 

The climax of the party can be activated with another command (default: `!finish`). This shows a finishing video (also
soon to be configurable). It's also possible to decrease the level (default: `!epyh`) or stop the party altogether
(default: `!endhype`). All the commands have limited usage by specific users (this is already configurable).

The original idea behind this was to have the levels shift automatically with Twitch Hype Train levels, but this hasn't
been implemented yet since I use it regardless of Hype Train and levels on my channel. I might add that later.

##### Commands:
- `!hype [LEVEL]` / `!party [LEVEL]`: Increases the hype level by LEVEL (default: 1). Starts the channel party if it's off.
- `!epyh` / `!ytrap`: Decreases the hype level by 1. Ends the channel party if it reaches 0.
- `!stophype`: Stops the channel party immediately.
- `!finish`: Stops the channel party and shows the ending video.


#### Countdown
Shows a countdown timer onscreen (via client page) which can be increased/decreased using shortcut keys or commands.

##### Commands:
- `!settime VALUE`: Sets the current time of the countdown timer.
- `!addtime VALUE`: Adds to the current time of the countdown timer.
- `!subtracttime VALUE`: Subtracts from the current time of the countdown timer.


#### F Shower
Drops down "F" images from above (via client page), normally as a "rest in peace" sign when the streamer dies in a game
(an "F's in chat" kind of thing). Invoked on command (default: `!f`). The dropped image is either selected randomly from
a pool of images or set to a specific one for a specific user. That is, if a user has their own `!f` image, it will drop
that image for them, otherwise it'll drop a random one from the pool.

Presently, the image pool is at a hard-coded location relative to the bot code location, as is the collection of
user-specific images. To add an image for a specific user, add it to the user-specific folder and name it after the user
(PNG files only at the moment).

##### Commands:
- `!f`: Drops down user-specific or a randomly selected F images from the top of the screen.


#### Image Commands
Shows an image and/or play a sound on command. The image/sound is shown/played on the client web page. Which commands
show which images is configurable; you can add as many such commands as you like. If such commands are used in quick
succession, they will be played one after the other rather than on top of each other.

This module has no default commands; all commands are created through configuration.


#### Image Display
This module has no direct interaction with the chat or streamer. It is used to display images and play sounds in a
central location, in order to avoid things overlapping. Multiple other modules use this module for image display and
sound playing.


#### Image Dropper
Similar to the Image Display module, this is not an interactive module, and is only used for dropping images from the
top of the screen. It is used by other modules, rather than directly.


#### Parrot Mate
Shows a parrot (the one from the game Phoenix Wright: Ace Attorney) which randomly says something out loud and in a
speech bubble while animating accordingly. Some speech sequences can also be triggered by command, or by reaction to
something else (at the moment there is one sequence that is triggered by the Image Display module when it shows a
specific image). You can add your own animated speech sequences by modifying the data files to add new sequences.

The random playing occurs in intervals. The delay between each sequence and the next is selected randomly from the range
of `[BASE - VARIANCE, BASE + VARIANCE]`, with the default base / variance being 5 minutes / 0 seconds (i.e. exactly 5
minutes apart). 

##### Commands:
- `!parrottime`: Sets the interval base.
- `!parrotoffset`: Sets the interval variance.
- `!parrotstart`: Starts the parrot playing a random sequence at intervals.
- `!parrotstop`: Stops the parrot playing a random sequence at intervals.


#### Random Image
Shows an image selected randomly from a predefined pool of images. Sends a message to the chat saying which image was
selected.

##### Commands:
- `!pixelate`: Shows a randomly selected picture from the image pool.


#### Scripted Modules
Aggregates other modules with web clients and shows them all in a single page. Should be used for modules whose clients
are meant to be shown on the entire screen (Countdown for example is a bad idea for it since you want to position the
client on the screen where you want the timer to show, rather than it taking the entire screen).

At the moment, the module code has a hard-coded list of the modules it shows. All you need to do in order to show the
full-screen web client of a module is include its name on the list, and put the ScriptedModules client as a source on
OBS. Modules that have web clients can define z-order values in order to specify which shows above which on the
ScriptedModules page.


#### Self Commands
Allows for assigning of an image and/or sound for specific users, which are shown/played when the user uses their own
username as a command (e.g. if a user called FooBar uses the command `!foobar`). Currently this is achieved by putting a
PNG/GIF image and/or an MP3 file with the base name as the target user's name in the predefinedm hard-coded relative
directory, but this is currently in the process of changing to the new configuration system.


#### Text Display
Similar to Image Display, this is an auxiliary module that is used by other modules to show styled text on the screen.
