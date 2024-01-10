// @ts-ignore
import SoundEffectManager from 'sound-effect-manager'

let sm: SoundEffectManager

if (typeof window !== 'undefined') {
	sm = new SoundEffectManager()

	// load some files by passing it a url and a name
	sm.loadFile('/audio/ding.wav', 'ding')
	sm.loadFile('/audio/bowl.wav', 'bowl')
	// sm.loadFile('/audio/pop.mp3', 'pop')
	// sm.loadFile('/audio/lightpop.mp3', 'lightpop')
	sm.loadFile('/audio/happy.wav', 'happy')
	sm.loadFile('/audio/epic.wav', 'epic')
	// sm.loadFile('/audio/beep.mp3', 'beep')
	// sm.loadFile('/audio/beep1.mp3', 'beep1')
}
export function play(p: string) {
	if (!sm) return
	sm.play(p)
}
