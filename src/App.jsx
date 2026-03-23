import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Home, Library, Download, Settings, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Plus, ChevronDown, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DEFAULT_COVER = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1DB954"/><stop offset="100%" stop-color="#191414"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><text x="100" y="115" text-anchor="middle" font-size="80" fill="white" opacity="0.5">\u266A</text></svg>')}`;

// Components
const Sidebar = ({ activeTab, setActiveTab, t, language }) => (
    <aside className="sidebar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: 'var(--brand-primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={20} fill="black" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>MusicPy</span>
        </div>

        <nav style={{ flexGrow: 1 }}>
            <ul style={{ listStyle: 'none', padding: '0 1.5rem', margin: 0 }}>
                <li style={{ marginBottom: '1.2rem' }}>
                    <a href="#" style={{ color: activeTab === 'home' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: activeTab === 'home' ? 'bold' : 'normal' }} onClick={(e) => { e.preventDefault(); setActiveTab('home'); }}>
                        <Home size={22} color={activeTab === 'home' ? 'white' : 'var(--text-secondary)'} />
                        {t.home}
                    </a>
                </li>
                <li style={{ marginBottom: '1.2rem' }}>
                    <a href="#" style={{ color: activeTab === 'search' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: activeTab === 'search' ? 'bold' : 'normal' }} onClick={(e) => { e.preventDefault(); setActiveTab('search'); }}>
                        <Search size={22} color={activeTab === 'search' ? 'white' : 'var(--text-secondary)'} />
                        {t.search}
                    </a>
                </li>
                <li style={{ marginBottom: '1.2rem' }}>
                    <a href="#" style={{ color: activeTab === 'library' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: activeTab === 'library' ? 'bold' : 'normal' }} onClick={(e) => { e.preventDefault(); setActiveTab('library'); }}>
                        <Library size={22} color={activeTab === 'library' ? 'white' : 'var(--text-secondary)'} />
                        {t.library}
                    </a>
                </li>
                <li style={{ marginBottom: '1.2rem' }}>
                    <a href="#" style={{ color: activeTab === 'downloads' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: activeTab === 'downloads' ? 'bold' : 'normal' }} onClick={(e) => { e.preventDefault(); setActiveTab('downloads'); }}>
                        <Download size={22} color={activeTab === 'downloads' ? 'white' : 'var(--text-secondary)'} />
                        {t.downloads}
                    </a>
                </li>
                <li style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.2rem' }}>
                    <a href="#" style={{ color: activeTab === 'settings' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: activeTab === 'settings' ? 'bold' : 'normal' }} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}>
                        <Settings size={22} color={activeTab === 'settings' ? 'white' : 'var(--text-secondary)'} />
                        {language === 'es' ? 'Ajustes y Cuenta' : 'Settings & Account'}
                    </a>
                </li>
            </ul>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1.5rem' }}>
            <a href="#" className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                <Settings size={24} /> {t.settings}
            </a>
        </div>
    </aside>
);

const Player = ({ currentTrack, isPlaying, setIsPlaying, audioRef, onExpand, volume, setVolume, onNext, onPrev, shuffleOn, toggleShuffle, repeatMode, cycleRepeat }) => {
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100 || 0);
            setDuration(audio.duration || 0);
        };

        audio.addEventListener('timeupdate', updateProgress);
        return () => audio.removeEventListener('timeupdate', updateProgress);
    }, [audioRef]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume, audioRef]);

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = percent * audio.duration;
    };

    const handleVolumeChange = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newVolume = Math.max(0, Math.min(1, x / rect.width));
        setVolume(newVolume);
    };

    return (
        <div className="player-bar" onClick={onExpand} style={{ cursor: 'pointer' }}>
            <div className="song-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '30%' }}>
                <motion.div whileHover={{ scale: 1.05 }} style={{ position: 'relative' }}>
                    <img src={currentTrack?.thumbnail || DEFAULT_COVER} style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
                </motion.div>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--text-primary)' }}>
                        {currentTrack?.title || 'No track selected'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {currentTrack?.artist || 'Unknown Artist'}
                    </div>
                </div>
            </div>

            <div className="controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Shuffle size={18} color={shuffleOn ? 'var(--brand-primary)' : 'var(--text-secondary)'} className="hover-scale" onClick={(e) => { e.stopPropagation(); toggleShuffle(); }} style={{ cursor: 'pointer' }} />
                    <SkipBack size={20} className="hover-scale" onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{ cursor: 'pointer' }} />
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ backgroundColor: 'white', color: 'black', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                    >
                        {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
                    </motion.div>
                    <SkipForward size={20} className="hover-scale" onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ cursor: 'pointer' }} />
                    <div onClick={(e) => { e.stopPropagation(); cycleRepeat(); }} style={{ cursor: 'pointer', position: 'relative' }}>
                        <Repeat size={18} color={repeatMode !== 'off' ? 'var(--brand-primary)' : 'var(--text-secondary)'} className="hover-scale" />
                        {repeatMode === 'one' && <span style={{ position: 'absolute', top: '-4px', right: '-6px', fontSize: '0.5rem', color: 'var(--brand-primary)', fontWeight: 'bold' }}>1</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', maxWidth: '450px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>{formatTime(audioRef.current?.currentTime)}</span>
                    <div
                        className="progress-container"
                        style={{ flex: 1, height: '4px', backgroundColor: '#4f4f4f', borderRadius: '2px', position: 'relative', cursor: 'pointer' }}
                        onClick={handleSeek}
                    >
                        <div style={{ position: 'absolute', left: 0, width: `${progress}%`, height: '100%', backgroundColor: 'var(--brand-primary)', borderRadius: '2px' }}></div>
                        <div className="progress-handle" style={{ position: 'absolute', left: `calc(${progress}% - 6px)`, top: '-4px', width: '12px', height: '12px', backgroundColor: 'white', borderRadius: '50%', opacity: 0, transition: 'opacity 0.2s' }}></div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '35px' }}>{formatTime(duration)}</span>
                </div>
            </div>

            <div className="extra-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', width: '30%' }}>
                <Volume2 size={18} color="var(--text-secondary)" onClick={(e) => { e.stopPropagation(); setVolume(volume === 0 ? 1 : 0); }} style={{ cursor: 'pointer' }} />
                <div 
                    className="volume-slider"
                    style={{ width: '100px', height: '4px', backgroundColor: '#4f4f4f', borderRadius: '2px', cursor: 'pointer', position: 'relative' }} 
                    onClick={handleVolumeChange}
                >
                    <div style={{ width: `${volume * 100}%`, height: '100%', backgroundColor: 'white', borderRadius: '2px' }}></div>
                </div>
            </div>
        </div>
    );
};

const VideoPreview = ({ video, onClose, handleDownload, language }) => (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)' }}>
        <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ width: '95%', maxWidth: '1000px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                ></iframe>
            </div>
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{video.title}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{video.channel}</p>
                </div>
                <button 
                    className="btn-primary" 
                    onClick={() => { handleDownload(video); onClose(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem 2rem' }}
                >
                    <Download size={24} /> {language === 'es' ? 'Descargar MP3' : 'Download MP3'}
                </button>
            </div>
            <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>X</button>
        </div>
    </div>
);

const ExpandedPlayer = ({ currentTrack, isPlaying, setIsPlaying, audioRef, onClose, volume, setVolume, onNext, onPrev, shuffleOn, toggleShuffle, repeatMode, cycleRepeat }) => {
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100 || 0);
            setDuration(audio.duration || 0);
        };
        audio.addEventListener('timeupdate', updateProgress);
        return () => audio.removeEventListener('timeupdate', updateProgress);
    }, [audioRef]);

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = percent * audio.duration;
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="expanded-player"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000, background: 'linear-gradient(to bottom, #282828, #121212)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
            <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} className="hover-scale">
                        <ChevronDown size={32} />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>PLAYING FROM LIBRARY</div>
                    </div>
                    <div style={{ width: '32px' }}></div>
                </header>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                    <motion.div
                        layoutId="player-art"
                        style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}
                    >
                        <img
                            src={currentTrack?.thumbnail || DEFAULT_COVER}
                            style={{ width: '100%', height: '100%', borderRadius: '12px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', objectFit: 'cover' }}
                        />
                    </motion.div>

                    <div style={{ width: '100%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{currentTrack?.title}</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{currentTrack?.artist || 'Unknown Artist'}</p>
                            </div>
                            <Plus size={24} className="hover-scale" style={{ marginTop: '0.5rem' }} />
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <div
                                className="progress-container"
                                style={{ height: '6px', backgroundColor: '#3e3e3e', borderRadius: '3px', position: 'relative', cursor: 'pointer' }}
                                onClick={handleSeek}
                            >
                                <div style={{ position: 'absolute', left: 0, width: `${progress}%`, height: '100%', backgroundColor: 'white', borderRadius: '3px' }}></div>
                                <div className="progress-handle" style={{ position: 'absolute', left: `calc(${progress}% - 8px)`, top: '-5px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>{formatTime(audioRef.current?.currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                            <Shuffle size={24} color={shuffleOn ? 'var(--brand-primary)' : 'var(--text-secondary)'} className="hover-scale" onClick={toggleShuffle} style={{ cursor: 'pointer' }} />
                            <SkipBack size={36} fill="white" className="hover-scale" onClick={onPrev} style={{ cursor: 'pointer' }} />
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                style={{ backgroundColor: 'white', color: 'black', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? <Pause size={36} fill="black" /> : <Play size={36} fill="black" />}
                            </motion.div>
                            <SkipForward size={36} fill="white" className="hover-scale" onClick={onNext} style={{ cursor: 'pointer' }} />
                            <div onClick={cycleRepeat} style={{ cursor: 'pointer', position: 'relative' }}>
                                <Repeat size={24} color={repeatMode !== 'off' ? 'var(--brand-primary)' : 'var(--text-secondary)'} className="hover-scale" />
                                {repeatMode === 'one' && <span style={{ position: 'absolute', top: '-6px', right: '-8px', fontSize: '0.6rem', color: 'var(--brand-primary)', fontWeight: 'bold' }}>1</span>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                            <Volume2 size={20} color="var(--text-secondary)" onClick={() => setVolume(volume === 0 ? 1 : 0)} style={{ cursor: 'pointer' }} />
                            <div 
                                className="volume-slider"
                                style={{ flex: 1, height: '4px', backgroundColor: '#3e3e3e', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    setVolume(Math.max(0, Math.min(1, x / rect.width)));
                                }}
                            >
                                <div style={{ width: `${volume * 100}%`, height: '100%', backgroundColor: 'white', borderRadius: '2px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
const SearchResults = ({ results, onDownload, onPreview, downloadAllFromMix, isDownloadingAll, language }) => (
    <div>
        {results.some(r => r.fromPlaylist) && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="btn-primary"
                    onClick={() => downloadAllFromMix(results)}
                    disabled={isDownloadingAll}
                    style={{ opacity: isDownloadingAll ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <Download size={20} /> {isDownloadingAll ? (language === 'es' ? 'Descargando...' : 'Downloading...') : (language === 'es' ? 'Descargar Todos' : 'Download All')}
                </button>
            </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {results.map(video => (
                <div key={video.id} className="video-card fade-in">
                    <div style={{ position: 'relative' }} onClick={() => onPreview(video)}>
                        <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                        <div
                            className="glass"
                            style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                            {video.duration}
                        </div>
                    </div>
                    <div style={{ marginTop: '0.8rem' }}>
                        <div
                            style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', cursor: 'pointer' }}
                            onClick={() => onPreview(video)}
                        >
                            {video.title}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.8rem' }}>{video.channel}</div>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={() => onDownload(video)}
                        >
                            <Download size={16} /> MP3
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const App = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadPath, setDownloadPath] = useState(localStorage.getItem('downloadPath') || '');
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
    const [localSongs, setLocalSongs] = useState(() => {
        const saved = localStorage.getItem('localSongs');
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
    const [showPreview, setShowPreview] = useState(null);
    const [volume, setVolume] = useState(parseFloat(localStorage.getItem('volume')) || 1);
    const [youtubeCookie, setYoutubeCookie] = useState(localStorage.getItem('youtubeCookie') || '');
    const [homeVideos, setHomeVideos] = useState([]);
    const [downloadQueue, setDownloadQueue] = useState([]);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [shuffleOn, setShuffleOn] = useState(false);
    const [repeatMode, setRepeatMode] = useState('off');
    const [playQueue, setPlayQueue] = useState([]);
    const [playIndex, setPlayIndex] = useState(-1);
    const [libraryFilter, setLibraryFilter] = useState('');
    const [mixUrl, setMixUrl] = useState('');
    const [mixVideos, setMixVideos] = useState([]);
    const [loadingMix, setLoadingMix] = useState(false);
    const audioRef = useRef(null);

    const toggleShuffle = () => setShuffleOn(prev => !prev);
    const cycleRepeat = () => setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');

    const playSong = useCallback((song, queue = null) => {
        if (queue) {
            let q = [...queue];
            if (shuffleOn) {
                for (let i = q.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [q[i], q[j]] = [q[j], q[i]];
                }
            }
            setPlayQueue(q);
            const idx = q.findIndex(s => s.id === song.id);
            setPlayIndex(idx >= 0 ? idx : 0);
        }
        setCurrentTrack(song);
        setIsPlaying(true);
    }, [shuffleOn]);

    const playNext = useCallback(() => {
        if (playQueue.length === 0) return;
        let nextIdx = playIndex + 1;
        if (nextIdx >= playQueue.length) {
            if (repeatMode === 'all') nextIdx = 0;
            else { setIsPlaying(false); return; }
        }
        setPlayIndex(nextIdx);
        setCurrentTrack(playQueue[nextIdx]);
        setIsPlaying(true);
    }, [playQueue, playIndex, repeatMode]);

    const playPrev = useCallback(() => {
        if (playQueue.length === 0) return;
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }
        let prevIdx = playIndex - 1;
        if (prevIdx < 0) prevIdx = repeatMode === 'all' ? playQueue.length - 1 : 0;
        setPlayIndex(prevIdx);
        setCurrentTrack(playQueue[prevIdx]);
        setIsPlaying(true);
    }, [playQueue, playIndex, repeatMode]);

    const handleTrackEnded = useCallback(() => {
        if (repeatMode === 'one') {
            if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
        } else {
            playNext();
        }
    }, [repeatMode, playNext]);

    const translations = {
        en: {
            home: 'Home', search: 'Search', library: 'Library', downloads: 'Downloads', settings: 'Settings',
            greeting: 'Good evening', searchPlaceholder: 'Search songs, artists, or paste YouTube Playlist URL...',
            noSongs: 'Your local library is empty', scanFolder: 'Scan Folder', addFiles: 'Add Files',
            version: 'App Version', downloadLocation: 'Download Location'
        },
        es: {
            home: 'Inicio', search: 'Buscar', library: 'Biblioteca', downloads: 'Descargas', settings: 'Ajustes',
            greeting: 'Buenas noches', searchPlaceholder: 'Busca canciones, artistas o pega URL de lista...',
            noSongs: 'Tu biblioteca local está vacía', scanFolder: 'Escanear Carpeta', addFiles: 'Añadir Archivos',
            version: 'Versión de la App', downloadLocation: 'Ubicación de Descarga'
        }
    };

    const t = translations[language];

    useEffect(() => {
        const fetchHome = async () => {
            try {
                const config = youtubeCookie ? { headers: { 'x-youtube-cookie': youtubeCookie } } : {};
                const res = await axios.get(`${API_BASE}/api/home`, config);
                setHomeVideos(res.data);
            } catch (e) { console.error("Home fetch error", e); }
        };
        fetchHome();
    }, [youtubeCookie]);

    useEffect(() => {
        if (!audioRef.current || !currentTrack) return;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Playback failed", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentTrack]);

    // Removed redundant loader since it's now handled in useState initializer

    useEffect(() => {
        localStorage.setItem('localSongs', JSON.stringify(localSongs));
    }, [localSongs]);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('downloadPath', downloadPath);
    }, [downloadPath]);

    useEffect(() => {
        localStorage.setItem('volume', volume.toString());
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume, audioRef.current]);

    useEffect(() => {
        localStorage.setItem('youtubeCookie', youtubeCookie);
    }, [youtubeCookie]);

    const handleSearch = async (e, forcedQuery = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const queryToUse = forcedQuery || searchQuery;
        if (!queryToUse) return;
        if (forcedQuery) setSearchQuery(forcedQuery);
        setLoading(true);
        setActiveTab('search');
        try {
            const config = youtubeCookie ? { headers: { 'x-youtube-cookie': youtubeCookie } } : {};
            // Detect playlist URL
            const playlistMatch = queryToUse.match(/[&?]list=([^&]+)/);
            if (playlistMatch) {
                const res = await axios.get(`${API_BASE}/api/playlist?list=${playlistMatch[1]}`, config);
                setSearchResults(res.data.map(v => ({ ...v, fromPlaylist: true })));
            } else {
                const res = await axios.get(`${API_BASE}/api/search?q=${encodeURIComponent(queryToUse)}`, config);
                setSearchResults(res.data);
            }
        } catch (e) {
            console.error("Search error", e);
        }
        setLoading(false);
    };

    const handleDownload = async (video) => {
        try {
            console.log('Initiating download for:', video.title);
            const response = await axios.get(`${API_BASE}/api/download-link?videoId=${video.id}`);
            const { downloadUrl, filename } = response.data;

            if (!downloadUrl) {
                throw new Error("No se pudo obtener el enlace de descarga.");
            }

            const proxyUrl = `${API_BASE}/api/proxy-download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;

            const newSong = {
                id: video.id,
                title: video.title || filename,
                artist: video.channel || 'YouTube Download',
                url: proxyUrl,
                thumbnail: video.thumbnail,
                duration: video.duration,
                downloadStatus: 'completed'
            };

            setLocalSongs(prev => {
                const filtered = prev.filter(s => s.id !== video.id);
                return [...filtered, newSong];
            });

            // Use window.location.assign for direct download trigger without new tab issues
            window.location.assign(proxyUrl);
        } catch (error) {
            console.error('Download failed', error);
            alert('Error: No se pudo procesar la descarga. Por favor, intenta de nuevo en unos segundos.');
        }
    };

    const handleAddLocalFiles = async (e) => {
        const files = Array.from(e.target.files);
        const newSongs = await Promise.all(files.map(async file => {
            const thumbnail = await getCoverArt(file);
            return {
                id: Math.random().toString(36).substr(2, 9),
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'Local File',
                url: URL.createObjectURL(file),
                thumbnail: thumbnail,
                duration: '--:--'
            };
        }));
        setLocalSongs(prev => [...prev, ...newSongs]);
    };

    const getCoverArt = async (file) => {
        try {
            const buffer = await file.arrayBuffer();
            const view = new DataView(buffer);
            if (view.getUint32(0) >>> 8 !== 0x494433) return null;

            let offset = 10;
            const tagSize = ((view.getUint8(6) & 0x7F) << 21) | ((view.getUint8(7) & 0x7F) << 14) | ((view.getUint8(8) & 0x7F) << 7) | (view.getUint8(9) & 0x7F);

            while (offset < tagSize) {
                const frameId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
                const frameSize = view.getUint32(offset + 4);
                if (frameId === 'APIC') {
                    const encoding = view.getUint8(offset + 10);
                    let mimeOffset = offset + 11;
                    while (view.getUint8(mimeOffset) !== 0) mimeOffset++;
                    let descriptionOffset = mimeOffset + 2;
                    while (view.getUint8(descriptionOffset) !== 0) descriptionOffset++;
                    const pictureType = view.getUint8(descriptionOffset + 1);
                    const dataOffset = descriptionOffset + 2;
                    const dataSize = frameSize - (dataOffset - offset - 10);
                    const data = buffer.slice(dataOffset, dataOffset + dataSize);
                    const blob = new Blob([data], { type: 'image/jpeg' });
                    return URL.createObjectURL(blob);
                }
                offset += frameSize + 10;
                if (frameSize <= 0) break;
            }
        } catch (e) { console.error("Error reading ID3", e); }
        return null;
    };

    const deleteSong = (id) => {
        if (confirm(language === 'es' ? '¿Estás seguro de que quieres eliminar esta canción?' : 'Are you sure you want to delete this song?')) {
            setLocalSongs(prev => prev.filter(s => s.id !== id));
        }
    };

    const checkDuplicates = () => {
        const names = new Set();
        const duplicates = [];
        localSongs.forEach(s => {
            if (names.has(s.title)) duplicates.push(s.title);
            else names.add(s.title);
        });
        if (duplicates.length > 0) {
            alert((language === 'es' ? 'Tienes canciones repetidas: ' : 'You have duplicate songs: ') + duplicates.join(', '));
        } else {
            alert(language === 'es' ? 'No se encontraron duplicados.' : 'No duplicates found.');
        }
    };

    const downloadAllFromMix = async (videos) => {
        setIsDownloadingAll(true);
        for (const video of videos) {
            await handleDownload(video);
            // Small delay between downloads
            await new Promise(r => setTimeout(r, 2000));
        }
        setIsDownloadingAll(false);
    };

    const handleScanFolder = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker();
            const songs = [];
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && (entry.name.endsWith('.mp3') || entry.name.endsWith('.m4a') || entry.name.endsWith('.wav'))) {
                    const file = await entry.getFile();
                    songs.push({
                        id: Math.random().toString(36).substr(2, 9),
                        title: entry.name.replace(/\.[^/.]+$/, ""),
                        artist: 'Local Folder',
                        url: URL.createObjectURL(file),
                        thumbnail: '',
                        duration: 'N/A'
                    });
                }
            }
            setLocalSongs(prev => [...prev, ...songs]);
        } catch (error) {
            console.error('Folder scan failed', error);
        }
    };

    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} t={t} language={language} />

            <main className="main-view">
                <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)', paddingBottom: '1rem' }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem 0.8rem 40px',
                                borderRadius: '30px',
                                border: 'none',
                                backgroundColor: 'var(--bg-highlight)',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </form>

                    <div className="user-profile" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--bg-highlight)' }}>
                            <Settings size={20} onClick={() => setActiveTab('settings')} style={{ cursor: 'pointer' }} />
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'home' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="home">
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800' }}>
                                {language === 'es' ? 'Descubre Nueva Música' : 'Discover New Music'}
                            </h1>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!mixUrl) return;
                                const playlistMatch = mixUrl.match(/[&?]list=([^&]+)/);
                                if (!playlistMatch) { alert(language === 'es' ? 'Pega un enlace de Mix/Playlist válido' : 'Paste a valid Mix/Playlist URL'); return; }
                                setLoadingMix(true);
                                try {
                                    const config = youtubeCookie ? { headers: { 'x-youtube-cookie': youtubeCookie } } : {};
                                    const res = await axios.get(`${API_BASE}/api/playlist?list=${playlistMatch[1]}`, config);
                                    setMixVideos(res.data);
                                } catch (err) { console.error('Mix fetch error', err); }
                                setLoadingMix(false);
                            }} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} size={18} color="var(--text-secondary)" />
                                    <input
                                        type="text"
                                        placeholder={language === 'es' ? 'Pega un enlace de Mix/Playlist de YouTube...' : 'Paste a YouTube Mix/Playlist URL...'}
                                        value={mixUrl}
                                        onChange={(e) => setMixUrl(e.target.value)}
                                        style={{ width: '100%', padding: '0.9rem 1rem 0.9rem 42px', borderRadius: '12px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-highlight)', color: 'white', outline: 'none', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{ padding: '0 2rem', borderRadius: '12px', whiteSpace: 'nowrap' }} disabled={loadingMix}>
                                    {loadingMix ? '...' : (language === 'es' ? 'Extraer Mix' : 'Extract Mix')}
                                </button>
                            </form>

                            {mixVideos.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2 style={{ fontSize: '1.4rem' }}>{language === 'es' ? 'Videos del Mix' : 'Mix Videos'} ({mixVideos.length})</h2>
                                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => downloadAllFromMix(mixVideos)} disabled={isDownloadingAll}>
                                            <Download size={18} /> {isDownloadingAll ? '...' : (language === 'es' ? 'Descargar Todos' : 'Download All')}
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                        {mixVideos.map(v => (
                                            <div key={v.id} className="video-card fade-in hover-scale" onClick={() => setShowPreview(v)} style={{ cursor: 'pointer' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <img src={v.thumbnail || DEFAULT_COVER} style={{ borderRadius: '10px', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                                                    {v.duration && <div className="glass" style={{ position: 'absolute', right: '8px', bottom: '8px', padding: '3px 8px', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '4px', fontSize: '0.7rem' }}>{v.duration}</div>}
                                                </div>
                                                <div style={{ padding: '0.6rem 0.3rem' }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {homeVideos.length === 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                                    {[1,2,3,4,5,6].map(i => (
                                        <div key={i} className="glass" style={{ height: '240px', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                                    {homeVideos.map(item => (
                                        <div 
                                            key={item.id} 
                                            className="video-card fade-in hover-scale" 
                                            onClick={() => {
                                                if (item.type === 'playlist') {
                                                    setSearchQuery(`?list=${item.id}`);
                                                    handleSearch({ preventDefault: () => {} }, `?list=${item.id}`);
                                                } else {
                                                    setShowPreview(item);
                                                }
                                            }}
                                            style={{ cursor: 'pointer', transformOrigin: 'center' }}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <img src={item.thumbnail || DEFAULT_COVER} className="video-thumbnail" style={{ borderRadius: '12px', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                                                {item.type === 'playlist' && (
                                                    <div className="glass" style={{ position: 'absolute', right: '10px', bottom: '15px', padding: '6px 12px', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        MIX • {item.videoCount} VIDEOS
                                                    </div>
                                                )}
                                                {item.type === 'video' && item.duration && (
                                                    <div className="glass" style={{ position: 'absolute', right: '10px', bottom: '15px', padding: '4px 8px', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        {item.duration}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '0.8rem 0.5rem' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '0.4rem', fontSize: '1.05rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.channel}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'search' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="search">
                            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t.search}</h1>
                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                                    <div className="spinner"></div>
                                </div>
                            ) : (
                                <SearchResults
                                    results={searchResults}
                                    onDownload={handleDownload}
                                    onPreview={setShowPreview}
                                    downloadAllFromMix={downloadAllFromMix}
                                    isDownloadingAll={isDownloadingAll}
                                    language={language}
                                />
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            key="settings"
                        >
                            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{t.settings}</h1>
                            <div style={{ maxWidth: '600px' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t.downloadLocation}</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            value={downloadPath}
                                            placeholder="/home/alone/Music"
                                            readOnly
                                            style={{ flex: 1, padding: '0.8rem', backgroundColor: 'var(--bg-highlight)', border: 'none', borderRadius: '8px', color: 'white' }}
                                        />
                                        <button className="btn-primary" onClick={() => alert('Folder picker would open here on local app')}>Change</button>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Language / Idioma</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--bg-highlight)', border: 'none', borderRadius: '8px', color: 'white' }}
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                    </select>
                                </div>
                                <div>
                                    <h3 style={{ marginBottom: '1rem' }}>{t.version}</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>v1.1.0 (Spotify Modern Clone)</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'downloads' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            key="downloads"
                        >
                            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{t.downloads}</h1>
                            <div style={{ color: 'var(--text-secondary)' }}>
                                <p>{language === 'es' ? 'Tus descargas aparecerán aquí una vez completadas.' : 'Your downloads will appear here once they are completed.'}</p>
                                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {localSongs.filter(s => s.url?.includes('proxy-download')).map(song => (
                                        <div key={song.id} className="glass" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setCurrentTrack(song); setIsPlaying(true); }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {song.thumbnail && <img src={song.thumbnail} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />}
                                                <span>{song.title}</span>
                                            </div>
                                            <span style={{ color: 'var(--brand-primary)', fontSize: '0.8rem' }}>{language === 'es' ? 'Completado' : 'Completed'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'library' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            key="library"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h1 style={{ fontSize: '2rem' }}>{t.library}</h1>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: 'var(--bg-highlight)', border: 'none', color: 'white', cursor: 'pointer' }} onClick={checkDuplicates}>
                                        {language === 'es' ? 'Chequear Duplicados' : 'Check Duplicates'}
                                    </button>
                                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleScanFolder}>
                                        <Library size={20} /> {t.scanFolder}
                                    </button>
                                    <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Plus size={20} /> {t.addFiles}
                                        <input type="file" multiple accept="audio/*" onChange={handleAddLocalFiles} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} size={18} color="var(--text-secondary)" />
                                <input
                                    type="text"
                                    placeholder={language === 'es' ? 'Buscar en tu biblioteca...' : 'Search your library...'}
                                    value={libraryFilter}
                                    onChange={(e) => setLibraryFilter(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 42px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-highlight)', color: 'white', outline: 'none', fontSize: '0.9rem' }}
                                />
                            </div>

                            {localSongs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
                                    <Library size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <h2>{t.noSongs}</h2>
                                    <p>Sync your local files to see them here.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 100px', padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', borderBottom: '1px solid var(--glass-border)', letterSpacing: '0.1em' }}>
                                        <span>TITLE</span>
                                        <span>ARTIST</span>
                                        <span style={{ textAlign: 'right' }}>DURATION</span>
                                    </div>
                                    {localSongs.filter(s => {
                                        if (!libraryFilter) return true;
                                        const f = libraryFilter.toLowerCase();
                                        return s.title.toLowerCase().includes(f) || (s.artist && s.artist.toLowerCase().includes(f));
                                    }).map((song, index) => (
                                        <div
                                            key={song.id}
                                            className="nav-link"
                                            style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 100px', cursor: 'pointer', alignItems: 'center', margin: '2px 0' }}
                                            onClick={() => playSong(song, localSongs)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                                <span style={{ color: 'var(--text-secondary)', width: '20px' }}>{index + 1}</span>
                                                <img src={song.thumbnail || DEFAULT_COVER} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <span style={{ fontWeight: '500', color: (currentTrack?.id === song.id) ? 'var(--brand-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                    {song.title}
                                                </span>
                                            </div>
                                            <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.artist}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                <span style={{ textAlign: 'right' }}>{song.duration}</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteSong(song.id); }}
                                                    style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '5px', fontSize: '0.75rem' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Player
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                audioRef={audioRef}
                onExpand={() => setIsPlayerExpanded(true)}
                volume={volume}
                setVolume={setVolume}
                onNext={playNext}
                onPrev={playPrev}
                shuffleOn={shuffleOn}
                toggleShuffle={toggleShuffle}
                repeatMode={repeatMode}
                cycleRepeat={cycleRepeat}
            />

            <AnimatePresence>
                {isPlayerExpanded && currentTrack && (
                        <ExpandedPlayer
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            audioRef={audioRef}
                            onClose={() => setIsPlayerExpanded(false)}
                            volume={volume}
                            setVolume={setVolume}
                            onNext={playNext}
                            onPrev={playPrev}
                            shuffleOn={shuffleOn}
                            toggleShuffle={toggleShuffle}
                            repeatMode={repeatMode}
                            cycleRepeat={cycleRepeat}
                        />
                )}
            </AnimatePresence>

            {showPreview && (
                <VideoPreview 
                    video={showPreview} 
                    onClose={() => setShowPreview(null)} 
                    handleDownload={handleDownload}
                    language={language}
                />
            )}

            <audio
                ref={audioRef}
                src={currentTrack?.url}
                onEnded={handleTrackEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Mobile Nav */}
            <div className="mobile-nav" style={{ display: 'none', position: 'fixed', bottom: 0, width: '100%', height: '60px', backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--glass-border)', zIndex: 1000 }}>
                <a href="#" className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')} style={{ flex: 1, flexDirection: 'column', fontSize: '0.6rem', gap: '4px' }}>
                    <Home size={20} /> {t.home}
                </a>
                <a href="#" className={`nav-link ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')} style={{ flex: 1, flexDirection: 'column', fontSize: '0.6rem', gap: '4px' }}>
                    <Search size={20} /> {t.search}
                </a>
                <a href="#" className={`nav-link ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')} style={{ flex: 1, flexDirection: 'column', fontSize: '0.6rem', gap: '4px' }}>
                    <Library size={20} /> {t.library}
                </a>
            </div>
        </div>
    );
};

export default App;
