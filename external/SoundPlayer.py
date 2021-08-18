'''
This script listens on stdin for input in the format of:
    VOLUME FILE_NAME
where VOLUME is a numerical floating point value between 0 and 1
(values outside this range behave the same as the value 1).
When a valid input is given, it plays the sound file located at FILE_NAME
at the specified volume.
Note: Playing the same file twice with different volume values will cause
the last volume value to be applied to both playbacks, even while playing.
'''

import os
import fileinput
import pygame

pygame.mixer.init()

CACHE_MAX_FILE_COUNT = 50
EXIT_STRING = 'exit'

class SoundPlayer:
    def __init__(self):
        self.cache = {}
        self.lruQueue = []

    def play(self, filePath, volume):
        filePath = os.path.abspath(filePath)
        if filePath in self.cache:
            audio = self._fetchSound(filePath)
        else:
            audio = self._addSound(filePath)

        self._playSound(audio, volume)

    def _fetchSound(self, filePath):
        audio = self.cache[filePath]
        self.lruQueue.remove(filePath)
        self.lruQueue.append(filePath)
        return audio

    def _addSound(self, filePath):
        if len(self.lruQueue) == CACHE_MAX_FILE_COUNT:
            fileToRemove = self.lruQueue.pop(0)
            del self.cache[fileToRemove]
        
        audio = self._loadSound(filePath)
        self.cache[filePath] = audio
        self.lruQueue.append(filePath)
        return audio
        
    
    # Uses the audio engine to load a sound file
    def _loadSound(self, filePath):
        return pygame.mixer.Sound(filePath)

    # Uses the audio engine to play a previously loaded sound
    def _playSound(self, audio, volume):
        # Consider switching audio engine to something that supports
        # playing the same sound with different volume multiple times
        # at once
        pygame.mixer.Sound.set_volume(audio, volume)
        pygame.mixer.Sound.play(audio)

player = SoundPlayer()

def parseAndPlay():
    for line in fileinput.input():
        line = line.strip()
        if line == EXIT_STRING:
            return

        try:
            splitIndex = line.index(' ')
            volume = float(line[:splitIndex])
            filePath = line[splitIndex:].strip()
            if os.path.isfile(filePath):
                player.play(filePath, volume)
        except:
            pass


if __name__ == '__main__':
    parseAndPlay()
