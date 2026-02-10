import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import { getActivePersona } from '@/lib/personas';
import { isIntenseModeAvailable } from '@/config/flags';
import { validatePhrasePack, importPhrasePack, getImportedPhrases, clearImportedPhrases } from '@/lib/phrasePack';
import { PersonaId } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideVolume2, LucideCheck, LucideUpload, LucideTrash2 } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ru', name: 'Русский' },
    { code: 'he', name: 'עברית' },
    { code: 'sw', name: 'Kiswahili' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ur', name: 'اردو' },
];

export const Settings: React.FC = () => {
    const { t } = useTranslation();
    const {
        personaId,
        speechEnabled,
        intenseModeEnabled,
        language,
        customTTS,
        setPersona,
        setSpeechEnabled,
        setIntenseMode,
        setLanguage,
        setCustomTTS,
        initialize,
    } = useSettingsStore();

    const [rate, setRate] = useState(customTTS?.rate ?? 1.1);
    const [pitch, setPitch] = useState(customTTS?.pitch ?? 1.0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [phrasePackStatus, setPhrasePackStatus] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        initialize();
        updatePhrasePackStatus();
    }, [initialize, language]);

    const updatePhrasePackStatus = () => {
        const imported = getImportedPhrases(language);
        if (imported && Object.keys(imported).length > 0) {
            setPhrasePackStatus(`${Object.keys(imported).length} custom phrases loaded`);
        } else {
            setPhrasePackStatus(t('settings.phrasePackStatus'));
        }
    };

    const handlePreview = () => {
        if (!window.speechSynthesis) {
            alert('Speech synthesis not supported in this browser');
            return;
        }

        const synth = window.speechSynthesis;

        if (synth.speaking) {
            synth.cancel();
            setIsSpeaking(false);
            return;
        }

        const persona = getActivePersona(personaId);
        const sampleText = t(persona.sampleKey);

        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.rate = customTTS?.rate ?? persona.tts.rate;
        utterance.pitch = customTTS?.pitch ?? persona.tts.pitch;
        utterance.lang = persona.tts.lang;

        const voices = synth.getVoices();
        const voice = voices.find(v => v.lang.startsWith(persona.tts.lang.split('-')[0]));
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synth.speak(utterance);
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRate = parseFloat(e.target.value);
        setRate(newRate);
        setCustomTTS(newRate, pitch);
    };

    const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPitch = parseFloat(e.target.value);
        setPitch(newPitch);
        setCustomTTS(rate, newPitch);
    };

    const handlePhrasePackImport = async () => {
        if (!fileInputRef.current) return;

        const file = fileInputRef.current.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const pack = JSON.parse(text);

            const validation = validatePhrasePack(pack);

            if (validation.warnings.length > 0) {
                console.warn('[PhrasePack] Warnings:', validation.warnings);
            }

            if (!validation.valid) {
                alert(`Import failed:\n${validation.errors.join('\n')}`);
                return;
            }

            importPhrasePack(pack);
            updatePhrasePackStatus();
            alert('Phrase pack imported successfully!');

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            alert(`Failed to import phrase pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleClearPhrases = () => {
        if (confirm('Clear all imported phrases for this language?')) {
            clearImportedPhrases(language);
            updatePhrasePackStatus();
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-zinc-100">{t('settings.title')}</h1>

            {/* Language Selection */}
            <Card className="bg-zinc-950/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">{t('settings.language')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* Persona Selection */}
            <Card className="bg-zinc-950/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">{t('settings.personaTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                        {(['supportive', 'neutral', 'strict'] as PersonaId[]).map((id) => {
                            const persona = getActivePersona(id);
                            const isActive = personaId === id;

                            return (
                                <button
                                    key={id}
                                    onClick={() => setPersona(id)}
                                    className={`p-4 rounded border-2 transition-all ${isActive
                                            ? 'border-red-600 bg-red-900/20 text-red-400'
                                            : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm font-bold">
                                            {t(persona.nameKey)}
                                        </span>
                                        {isActive && <LucideCheck className="w-4 h-4" />}
                                    </div>
                                    <div className="text-xs text-zinc-500 space-y-1">
                                        <div>W: {persona.style.warmth}</div>
                                        <div>D: {persona.style.directness}</div>
                                        <div>F: {persona.style.formality}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Speech Settings */}
            <Card className="bg-zinc-950/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">Voice Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-zinc-300">{t('settings.speechEnabled')}</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={speechEnabled}
                                onChange={(e) => setSpeechEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </div>
                    </label>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            {t('settings.rate')}: {rate.toFixed(1)}x
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={rate}
                            onChange={handleRateChange}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            {t('settings.pitch')}: {pitch.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={pitch}
                            onChange={handlePitchChange}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>

                    <Button
                        onClick={handlePreview}
                        disabled={!speechEnabled}
                        className="w-full bg-red-900 hover:bg-red-800 text-white font-mono uppercase tracking-wider"
                    >
                        <LucideVolume2 className="w-4 h-4 mr-2" />
                        {isSpeaking ? 'Stop' : t('settings.preview')}
                    </Button>

                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-400 italic">
                        {t(getActivePersona(personaId).sampleKey)}
                    </div>
                </CardContent>
            </Card>

            {/* Intense Mode (only if capable) */}
            {isIntenseModeAvailable() && (
                <Card className="bg-zinc-950/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-zinc-100">{t('settings.intenseModeTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-zinc-400">{t('settings.intenseModeHint')}</p>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-zinc-300">Enable Intense Mode</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={intenseModeEnabled}
                                    onChange={(e) => setIntenseMode(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </div>
                        </label>
                    </CardContent>
                </Card>
            )}

            {/* Phrase Pack Import */}
            <Card className="bg-zinc-950/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">{t('settings.phrasePackTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400">{phrasePackStatus}</p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handlePhrasePackImport}
                        className="hidden"
                    />

                    <div className="flex gap-2">
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                        >
                            <LucideUpload className="w-4 h-4 mr-2" />
                            {t('settings.phrasePackImport')}
                        </Button>

                        <Button
                            onClick={handleClearPhrases}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                        >
                            <LucideTrash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
