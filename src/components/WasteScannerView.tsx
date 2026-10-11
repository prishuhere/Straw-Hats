import React, { useState, useRef } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import { scanWasteItem, WasteScanResult } from '../services/api';
import {
  ArrowLeft,
  Camera,
  Sparkles,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  ShieldCheck,
  MapPin,
  Youtube,
  BookOpen,
  ExternalLink,
  IndianRupee,
  Navigation,
} from 'lucide-react';
import { KabadiwalaScrapCalculator } from './KabadiwalaScrapCalculator';

const FLOWER_CHOICES = ['🌼', '🌸', '🌻', '🌺', '🌷', '💮', '🪻'];

export const WasteScannerView: React.FC = () => {
  const {
    userSettings,
    addEcoReport,
    ecoFlowers,
    streakDays,
    setRewardModalOpen,
    setActiveTab,
    addBioAction,
    pendingBioReport,
    setPendingBioReport,
    showToast,
    triggerConfetti,
    addWasteLog,
    currentUser,
  } = useGreenPulse();

  // Mode: 'report' (default EcoQuest report form), 'bio' (Give Waste a Second Life), or 'ai_deep' (multimodal polymer analysis)
  const [activeSubMode, setActiveSubMode] = useState<'report' | 'bio' | 'ai_deep'>('report');

  // EcoQuest Report Form State
  const [reportPhoto, setReportPhoto] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [wasteType, setWasteType] = useState<string>('Plastic');

  // Google Maps Coordinates & Picker State
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 }); // Default New Delhi, India
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));
        setMapCoords({ lat, lng });
        if (!location) {
          setLocation(`Pin @ ${lat}, ${lng}`);
        }
        setShowMapPicker(true);
        setIsLocatingGps(false);
        showToast('Exact GPS Location pinned on Google Maps! 📍');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocatingGps(false);
        showToast('Could not access GPS. Please type the location or adjust map pin.');
      },
      { timeout: 8000 }
    );
  };

  // Biodegradable Second Life Form State
  const [bioActionSelected, setBioActionSelected] = useState<string>('compost');
  const [proofPhoto, setProofPhoto] = useState<string>('');
  const [proofNote, setProofNote] = useState<string>('');

  // AI Multimodal Scan State
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [aiScanResult, setAiScanResult] = useState<WasteScanResult | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // File upload handler for main report
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Please choose an image under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setReportPhoto(dataUrl);
      showToast('Photo uploaded! Ready to submit or scan with AI.');
    };
    reader.readAsDataURL(file);
  };

  // Proof photo upload handler
  const handleProofPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Please choose an image under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit main waste report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPhoto) {
      showToast('Please add a waste photo first.');
      return;
    }
    if (!description.trim()) {
      showToast('Add a short description of what you spotted.');
      return;
    }

    const randomFlower = FLOWER_CHOICES[Math.floor(Math.random() * FLOWER_CHOICES.length)];
    const authorName = userSettings.userName || (currentUser ? currentUser.name : 'Eco Explorer');

    const estimatedKabadiwala = wasteType === 'Plastic' ? 18 : wasteType === 'Paper' ? 14 : wasteType === 'Mixed litter' ? 10 : 5;

    // Add to shared EcoQuest state with GPS & Google Maps coordinates
    addEcoReport({
      photo: reportPhoto,
      description: description.trim(),
      location: location.trim() || `Lat ${mapCoords.lat}, Lng ${mapCoords.lng}`,
      type: wasteType,
      flower: randomFlower,
      author: authorName,
      lat: mapCoords.lat,
      lng: mapCoords.lng,
      kabadiwalaValueInr: estimatedKabadiwala,
    });

    // Also record into the analytical engine
    addWasteLog({
      name: description.trim(),
      category: wasteType === 'Food waste' ? 'Compost' : wasteType === 'Plastic' ? 'Recycle' : 'Landfill',
      materialType: wasteType,
      confidence: 0.95,
      handlingSteps: ['Separated from mixed trash', 'Logged for local cleanup'],
      contaminationAlerts: [],
      reuseIdeas: ['Recycle or divert to dedicated streams'],
      estimatedWeightKg: 0.15,
      avoidedCo2eKg: 0.28,
      diversionEligible: wasteType !== 'Landfill',
      funEcoFact: 'Reporting waste encourages community stewardship and prevents litter migration.',
      imageUrl: reportPhoto,
    });

    triggerConfetti();
    showToast(`Report submitted! You earned a flower ${randomFlower}`);

    // If biodegradable, transition to 2nd life proof screen
    if (wasteType === 'Food waste' || wasteType === 'Paper') {
      setPendingBioReport({
        id: Date.now(),
        description: description.trim(),
        type: wasteType,
        location: location.trim(),
      });
      setActiveSubMode('bio');
      return;
    }

    // Reset form
    setDescription('');
    setLocation('');
    setReportPhoto('');
  };

  // Submit Biodegradable Proof
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofPhoto) {
      showToast('Please upload a photo of your completed green action.');
      return;
    }

    const labels: Record<string, string> = {
      compost: 'Composted suitable organic scraps',
      mulch: 'Used clean dry leaves or plant trimmings as mulch',
      collection: 'Separated organic waste for collection',
      reuse: 'Reused plant material in a garden project',
    };

    addBioAction({
      action: bioActionSelected,
      actionLabel: labels[bioActionSelected] || 'Completed green action',
      note: proofNote.trim(),
      photo: proofPhoto,
    });

    triggerConfetti();
    setProofPhoto('');
    setProofNote('');
    setPendingBioReport(null);
    setActiveSubMode('report');
    showToast('Proof submitted! +25 bonus green points earned 🌿');
  };

  // Run Gemini Multimodal AI Scan
  const handleRunAiScan = async () => {
    if (!reportPhoto) {
      showToast('Upload a photo first to run AI recognition.');
      return;
    }
    setIsScanningAi(true);
    setAiErrorMessage(null);

    try {
      const res = await scanWasteItem({
        imageBase64: reportPhoto,
        mimeType: 'image/jpeg',
      });
      setAiScanResult(res.data);
      if (res.data.itemName && !description) {
        setDescription(res.data.itemName);
      }
      showToast('Multimodal AI scan complete!');
    } catch {
      setAiErrorMessage('AI scanner could not identify the item. You can still submit your report manually!');
    } finally {
      setIsScanningAi(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-xs font-bold text-[#8fe77d] hover:text-[#d9f69b] flex items-center gap-1.5 transition-colors mb-2 bg-transparent border-0 cursor-pointer p-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home Overview</span>
          </button>
          <div className="page-heading pt-0 pb-0">
            <span className="section-kicker">TAKE ACTION</span>
            <h1 className="eco-title m-0">
              See it. Snap it. <span>Change it.</span>
            </h1>
            <p className="muted mt-2">
              Found waste in your street, park, or campus? Upload a photo and help your community see what needs care.
            </p>
          </div>
        </div>

        {/* Sub-mode Switcher */}
        <div className="flex items-center gap-2 bg-[#0b2418] p-1.5 rounded-2xl border border-[#8fe77d]/20">
          <button
            onClick={() => setActiveSubMode('report')}
            className={`btn text-xs px-3 py-1.5 rounded-xl ${
              activeSubMode === 'report' ? 'btn-primary' : 'btn-ghost border-transparent'
            }`}
          >
            📸 Report Form
          </button>
          <button
            onClick={() => setActiveSubMode('bio')}
            className={`btn text-xs px-3 py-1.5 rounded-xl ${
              activeSubMode === 'bio' ? 'btn-primary' : 'btn-ghost border-transparent'
            }`}
          >
            🌿 2nd Life Proof
          </button>
          <button
            onClick={() => setActiveSubMode('ai_deep')}
            className={`btn text-xs px-3 py-1.5 rounded-xl ${
              activeSubMode === 'ai_deep' ? 'btn-primary' : 'btn-ghost border-transparent'
            }`}
          >
            ✨ AI Material Scan
          </button>
        </div>
      </div>

      {/* Mode 1: Main EcoQuest Waste Report & Garden */}
      {activeSubMode === 'report' && (
        <div className="grid-two">
          {/* Left Column: New Report Form */}
          <section className="panel">
            <div className="flex items-center justify-between mb-2">
              <span className="section-kicker">NEW REPORT</span>
              <button
                type="button"
                onClick={handleRunAiScan}
                disabled={!reportPhoto || isScanningAi}
                className="text-[11px] font-bold text-[#77d9ee] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#77d9ee]" />
                <span>{isScanningAi ? 'Scanning with AI...' : 'Auto-detect with AI'}</span>
              </button>
            </div>
            <h2>
              Report <span>waste</span>
            </h2>

            <form onSubmit={handleSubmitReport} id="reportForm">
              {/* Photo Upload Zone */}
              <label className="upload-zone" id="dropZone" htmlFor="wastePhotoInput">
                <input
                  type="file"
                  id="wastePhotoInput"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                />
                {!reportPhoto ? (
                  <div id="uploadPrompt" className="text-center p-4">
                    <div className="upload-symbol mx-auto mb-2">↑</div>
                    <strong>Choose a waste photo</strong>
                    <span className="block mt-1">or take a photo with camera · JPG, PNG, WEBP</span>
                    <small className="block mt-1">Use a clear photo. Maximum 2 MB.</small>
                  </div>
                ) : (
                  <div className="relative w-full text-center p-2">
                    <img
                      src={reportPhoto}
                      alt="Uploaded waste preview"
                      className="max-h-56 mx-auto rounded-lg object-contain"
                    />
                    <span className="text-[10px] text-[#8fe77d] block mt-2">
                      ✓ Photo loaded. Click to replace.
                    </span>
                  </div>
                )}
              </label>

              {/* Description */}
              <label className="field-label" htmlFor="wasteDesc">
                What did you spot?
              </label>
              <input
                id="wasteDesc"
                className="field"
                maxLength={140}
                placeholder="e.g. Plastic bottles near the bus stop"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              {/* Location with Google Maps Integration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="field-label m-0" htmlFor="wasteLoc">
                    Exact Location & Google Maps
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGetGpsLocation}
                      disabled={isLocatingGps}
                      className="text-[11px] font-bold text-[#8fe77d] hover:text-[#d9f69b] flex items-center gap-1 bg-[#102b1d] px-2 py-0.5 rounded-lg border border-[#8fe77d]/30 cursor-pointer disabled:opacity-50"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{isLocatingGps ? 'Locating...' : 'Use My GPS'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="text-[11px] font-bold text-[#77d9ee] hover:text-[#b0effc] flex items-center gap-1 bg-[#0b2418] px-2 py-0.5 rounded-lg border border-[#77d9ee]/30 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{showMapPicker ? 'Hide Map' : 'Show Map'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="wasteLoc"
                    className="field flex-1"
                    maxLength={120}
                    placeholder="e.g. MG Road, Near Central Park, Connaught Place"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Interactive Google Maps Pin & Embed */}
                {showMapPicker && (
                  <div className="space-y-1.5 pt-1 animate-fade-in">
                    <div className="rounded-xl overflow-hidden border border-[#8fe77d]/30 bg-[#04160e] h-44 w-full shadow-inner">
                      <iframe
                        title="Waste Location on Google Maps"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        src={`https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&z=15&output=embed`}
                        className="w-full h-full border-0"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#a4b9a8] px-1">
                      <span className="font-mono">
                        Pinned Coordinates: {mapCoords.lat.toFixed(4)}, {mapCoords.lng.toFixed(4)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8fe77d] hover:underline flex items-center gap-1 font-bold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Full Google Maps</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Waste Type */}
              <label className="field-label" htmlFor="wasteTypeSelect">
                Waste type
              </label>
              <select
                id="wasteTypeSelect"
                className="field"
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
              >
                <option value="Plastic">Plastic</option>
                <option value="Food waste">Food waste (Organic)</option>
                <option value="Paper">Paper / Cardboard</option>
                <option value="Mixed litter">Mixed litter</option>
                <option value="E-waste">E-waste / Batteries</option>
                <option value="Other">Other</option>
              </select>

              <button className="btn btn-primary form-submit" type="submit">
                Submit report & earn a flower ↗
              </button>
              <p className="privacy-note">
                Demo mode: reports are shared with the local community stream.
              </p>
            </form>
          </section>

          {/* Right Column: Virtual Garden & 7-Day Streak */}
          <div className="space-y-4">
            {/* Virtual Garden Panel */}
            <section className="panel">
              <span className="section-kicker">GOOD DEEDS IN BLOOM</span>
              <h2>
                Your virtual <span>garden</span>
              </h2>
              <p className="muted">Every successful report plants a flower.</p>

              <div className="garden" id="garden">
                {ecoFlowers.length === 0 ? (
                  <span className="muted">Your first flower is waiting 🌱</span>
                ) : (
                  ecoFlowers.slice(-35).map((fl, i) => (
                    <span
                      key={i}
                      className="flower"
                      style={{ animationDelay: `${Math.min(i * 0.02, 0.4)}s` }}
                    >
                      {fl}
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[#a4b9a8]">
                <span>Flowers collected:</span>
                <b style={{ color: 'var(--green)' }} className="text-sm font-mono">
                  {ecoFlowers.length}
                </b>
              </div>
            </section>

            {/* 7-Day Streak Panel */}
            <section className="panel">
              <span className="section-kicker">CONSISTENCY IS MAGIC</span>
              <h2>
                Your 7-day <span>streak</span>
              </h2>
              <div className="streak-number">
                <strong id="streakCount">{streakDays}</strong>
                <span>/ 7 days</span>
              </div>
              <p className="muted" id="streakMessage">
                {streakDays >= 7
                  ? 'Amazing! Your seven-day streak is complete.'
                  : `${Math.max(1, 7 - streakDays)} more day(s) to unlock your reward!`}
              </p>

              <div className="streak-track">
                {['🌱', '💧', '♻️', '🌿', '🌼', '🌳', '🏆'].map((emoji, i) => {
                  const isDone = i < streakDays;
                  return (
                    <div key={i} className={`streak-step ${isDone ? 'done' : ''}`}>
                      <span>{isDone ? '✓' : emoji}</span>
                      <small>Day {i + 1}</small>
                    </div>
                  );
                })}
              </div>

              <div className="reward-strip">
                <span>🏅</span>
                <div>
                  <b>Letter of Appreciation</b>
                  <small>Unlock celebration reward after seven consecutive days.</small>
                </div>
              </div>

              <button
                className="btn btn-secondary form-submit"
                onClick={() => setRewardModalOpen(true)}
                disabled={streakDays < 7}
              >
                {streakDays >= 7 ? 'View & Claim Reward 🎉' : 'Unlock at 7 days'}
              </button>
            </section>
          </div>
        </div>
      )}

      {/* Mode 2: Biodegradable Second Life Flow */}
      {activeSubMode === 'bio' && (
        <div className="space-y-6">
          <div className="page-heading pt-0 pb-2">
            <span className="section-kicker">BIO-WASTE DETECTED 🌿</span>
            <h1 className="eco-title m-0">
              Give it a <span>second life.</span>
            </h1>
            <p className="muted mt-2">
              Choose what you did with this biodegradable waste, then upload a photo of your completed action to earn bonus green points.
            </p>
          </div>

          <section className="panel">
            <div className="bio-detected">
              <div className="bio-icon">🍃</div>
              <div>
                <span className="section-kicker">YOUR REPORTED WASTE</span>
                <h2>
                  {pendingBioReport?.type === 'Paper'
                    ? 'Paper and plant-based waste'
                    : 'Food and organic scraps'}
                </h2>
                <p className="muted">
                  {pendingBioReport
                    ? `You reported: ${pendingBioReport.description}${
                        pendingBioReport.location ? ' · ' + pendingBioReport.location : ''
                      }`
                    : 'Turn suitable organic scraps into something restorative.'}
                </p>
              </div>
            </div>

            <div className="bio-options">
              <label
                className={`bio-option ${bioActionSelected === 'compost' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="bioAction"
                  value="compost"
                  checked={bioActionSelected === 'compost'}
                  onChange={(e) => setBioActionSelected(e.target.value)}
                />
                <span className="bio-option-emoji">🌱</span>
                <span>
                  <b>Compost it</b>
                  <small>
                    Add fruit and vegetable scraps to a compost bin with dry leaves or brown material.
                  </small>
                </span>
              </label>

              <label
                className={`bio-option ${bioActionSelected === 'mulch' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="bioAction"
                  value="mulch"
                  checked={bioActionSelected === 'mulch'}
                  onChange={(e) => setBioActionSelected(e.target.value)}
                />
                <span className="bio-option-emoji">🍂</span>
                <span>
                  <b>Use as garden mulch</b>
                  <small>
                    Use clean dry leaves or untreated plant trimmings to cover garden soil and retain moisture.
                  </small>
                </span>
              </label>

              <label
                className={`bio-option ${bioActionSelected === 'collection' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="bioAction"
                  value="collection"
                  checked={bioActionSelected === 'collection'}
                  onChange={(e) => setBioActionSelected(e.target.value)}
                />
                <span className="bio-option-emoji">♻️</span>
                <span>
                  <b>Separate for collection</b>
                  <small>
                    Keep organic waste separate for municipal green bin or local composting collection.
                  </small>
                </span>
              </label>

              <label
                className={`bio-option ${bioActionSelected === 'reuse' ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="bioAction"
                  value="reuse"
                  checked={bioActionSelected === 'reuse'}
                  onChange={(e) => setBioActionSelected(e.target.value)}
                />
                <span className="bio-option-emoji">🪴</span>
                <span>
                  <b>Reuse plant material</b>
                  <small>Reuse clean plant material in home garden pots, crafts, or soil feeding.</small>
                </span>
              </label>
            </div>

            <p className="bio-safety">
              Safety tip: don&apos;t handle unknown, chemical, medical, or contaminated waste. Ask an adult or local waste service if you&apos;re unsure.
            </p>
          </section>

          {/* Proof Photo Upload Section */}
          <section className="panel bio-proof-panel">
            <span className="section-kicker">SHOW YOUR GREEN ACTION</span>
            <h2>
              Upload your <span>proof photo.</span>
            </h2>
            <p className="muted">
              Choose an action, complete it, and upload a photo of the result to verify +25 bonus points.
            </p>

            <form onSubmit={handleSubmitProof} id="bioProofForm">
              <label className="field-label" htmlFor="proofPhotoInput">
                Photo of what you did
              </label>
              <label className="upload-zone" htmlFor="proofPhotoInput">
                <input
                  type="file"
                  id="proofPhotoInput"
                  accept="image/*"
                  onChange={handleProofPhotoSelect}
                  required
                />
                {!proofPhoto ? (
                  <div className="text-center p-4">
                    <div className="upload-symbol mx-auto mb-2">↑</div>
                    <strong>Choose your proof photo</strong>
                    <span className="block mt-1">JPG, PNG or WEBP · under 2 MB</span>
                  </div>
                ) : (
                  <div className="relative w-full text-center p-2">
                    <img
                      src={proofPhoto}
                      alt="Proof photo preview"
                      className="max-h-56 mx-auto rounded-lg object-contain"
                    />
                    <span className="text-[10px] text-[#8fe77d] block mt-2">
                      ✓ Proof photo attached
                    </span>
                  </div>
                )}
              </label>

              <label className="field-label" htmlFor="proofNoteInput">
                What did you do? (optional)
              </label>
              <input
                id="proofNoteInput"
                className="field"
                maxLength={160}
                placeholder="e.g. Added vegetable peels to my backyard compost bin"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
              />

              <button className="btn btn-primary form-submit" type="submit">
                Submit proof & earn bonus points ✨
              </button>
            </form>

            <div className="bonus-card">
              <span>⭐</span>
              <div>
                <b>Bonus reward: +25 green points</b>
                <small>One bonus per submitted action. Stored safely in your local profile.</small>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Mode 3: AI Multimodal Material Scanner */}
      {activeSubMode === 'ai_deep' && (
        <section className="panel space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8fe77d]/15 pb-4">
            <div>
              <span className="section-kicker">GEMINI MULTIMODAL VISION</span>
              <h2 className="m-0">
                Resin polymer & <span>material intelligence.</span>
              </h2>
              <p className="muted mt-1">
                Deep vision analysis identifying #1 PET, #2 HDPE, #5 PP, contamination hazards, and CO₂e offsets.
              </p>
            </div>
            <button
              onClick={handleRunAiScan}
              disabled={!reportPhoto || isScanningAi}
              className="btn btn-primary"
            >
              {isScanningAi ? 'Analyzing photo...' : 'Run Vision AI Analysis ✦'}
            </button>
          </div>

          {!reportPhoto ? (
            <div className="text-center py-12 border border-dashed border-[#8fe77d]/30 rounded-2xl bg-[#071b11]">
              <span className="text-4xl block mb-2">📸</span>
              <p className="muted">Please upload or capture a photo in the Report tab first.</p>
              <button onClick={() => setActiveSubMode('report')} className="btn btn-ghost mt-3">
                Go to Upload Photo ↗
              </button>
            </div>
          ) : isScanningAi ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-[#8fe77d] animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-[#f4f4df]">Analyzing polymer & composition with Gemini...</p>
              <span className="text-xs text-[#a4b9a8]">Checking localized contamination risks and carbon metrics</span>
            </div>
          ) : aiScanResult ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4">
                  <span className="text-xs text-[#a4b9a8]">Detected Item</span>
                  <h3 className="text-lg font-bold text-[#f4f4df] m-0 mt-1">
                    {aiScanResult.itemName}
                  </h3>
                  <span className="text-xs text-[#8fe77d] font-semibold mt-1 block">
                    Material: {aiScanResult.materialType}
                  </span>
                </div>

                <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4">
                  <span className="text-xs text-[#a4b9a8]">Recommended Category</span>
                  <h3 className="text-lg font-bold text-[#8fe77d] m-0 mt-1">
                    {aiScanResult.category}
                  </h3>
                  <span className="text-xs text-[#a4b9a8] font-mono mt-1 block">
                    Confidence: {Math.round(aiScanResult.confidence * 100)}%
                  </span>
                </div>

                <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4">
                  <span className="text-xs text-[#a4b9a8]">Avoided Footprint</span>
                  <h3 className="text-lg font-bold text-[#f4cc69] m-0 mt-1">
                    +{aiScanResult.estimatedWeightKg * 1.8} kg CO₂e
                  </h3>
                  <span className="text-xs text-[#a4b9a8] mt-1 block">
                    Weight: ~{Math.round(aiScanResult.estimatedWeightKg * 1000)}g
                  </span>
                </div>
              </div>

              {/* Handling Instructions */}
              <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-[#f4f4df] flex items-center gap-2 m-0">
                  <CheckCircle2 className="w-4 h-4 text-[#8fe77d]" />
                  <span>Verified Handling Steps</span>
                </h4>
                <ul className="text-xs text-[#b8cabb] space-y-1 pl-5 list-disc m-0">
                  {aiScanResult.handlingSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              {/* Contamination Alert */}
              {aiScanResult.contaminationAlerts && aiScanResult.contaminationAlerts.length > 0 && (
                <div className="bg-[#241315] border border-[#ff9e9a]/30 rounded-2xl p-4 space-y-1">
                  <h4 className="text-sm font-bold text-[#ff9e9a] flex items-center gap-2 m-0">
                    <AlertTriangle className="w-4 h-4 text-[#ff9e9a]" />
                    <span>Contamination Warnings</span>
                  </h4>
                  <ul className="text-xs text-[#ffc8c6] space-y-1 pl-5 list-disc m-0">
                    {aiScanResult.contaminationAlerts.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ways to Reuse & Upcycle this Material */}
              <div className="bg-[#0b2418] border border-[#8fe77d]/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#8fe77d] flex items-center gap-2 m-0">
                    <Sparkles className="w-4 h-4 text-[#8fe77d]" />
                    <span>How to Reuse & Upcycle This Item</span>
                  </h4>
                  <span className="text-[10px] text-[#f4cc69] font-mono bg-[#102b1d] px-2 py-0.5 rounded-full border border-[#8fe77d]/20">
                    Second Life
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(aiScanResult.reuseIdeas && aiScanResult.reuseIdeas.length > 0
                    ? aiScanResult.reuseIdeas
                    : [
                        'Repurpose for home seedlings or indoor microgreens',
                        'Use as durable craft storage or DIY organizing containers',
                        'Flatten clean cardboard for sheet mulching or weed barriers'
                      ]
                  ).map((idea, idx) => (
                    <div
                      key={idx}
                      className="bg-[#05170f] p-2.5 rounded-xl border border-[#8fe77d]/15 flex items-start gap-2"
                    >
                      <span className="text-[#8fe77d] mt-0.5">🌱</span>
                      <span className="text-[#e2f1e4] leading-relaxed">{idea}</span>
                    </div>
                  ))}
                </div>

                {/* Direct DIY Video & Encyclopedia Links */}
                <div className="pt-2 border-t border-[#8fe77d]/15 flex flex-wrap items-center gap-2">
                  <a
                    href={
                      aiScanResult.youtubeUrl ||
                      `https://www.youtube.com/results?search_query=${encodeURIComponent(
                        `how to reuse ${aiScanResult.itemName} diy upcycle craft ideas`
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-[#cc0000]/15 hover:bg-[#cc0000]/25 border border-[#cc0000]/40 text-[#ff7373] text-xs font-bold transition-all flex items-center gap-2 no-underline"
                  >
                    <Youtube className="w-4 h-4 text-[#ff4444]" />
                    <span>Watch YouTube DIY Video Guides ↗</span>
                  </a>

                  <a
                    href={
                      aiScanResult.wikipediaUrl ||
                      `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(
                        aiScanResult.materialType || aiScanResult.itemName
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-[#082216] hover:bg-[#102b1d] border border-[#8fe77d]/30 text-[#8fe77d] text-xs font-bold transition-all flex items-center gap-2 no-underline"
                  >
                    <BookOpen className="w-4 h-4 text-[#8fe77d]" />
                    <span>Read Recycling Science on Wikipedia ↗</span>
                  </a>
                </div>
              </div>

              {/* Tangible Environmental & Monetary Benefits */}
              <div className="bg-[#071c12] border border-[#8fe77d]/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#f4cc69] flex items-center gap-2 m-0">
                    <ShieldCheck className="w-4 h-4 text-[#f4cc69]" />
                    <span>Concrete Benefits of Reusing & Recycling This Item</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-[#8fe77d]">
                    Kabadiwala Value: ~₹{aiScanResult.kabadiwalaPriceInrPerKg || 14}/kg
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-[#05170f] p-3 rounded-xl border border-[#77d9ee]/20">
                    <span className="text-[10px] text-[#77d9ee] font-mono uppercase font-bold block">
                      💧 Water Conserved
                    </span>
                    <strong className="text-base text-[#f4f4df] font-mono mt-0.5 block">
                      ~{Math.round(aiScanResult.estimatedWeightKg * 28)} Liters
                    </strong>
                    <span className="text-[10px] text-[#a4b9a8] block mt-0.5">
                      Spares clean water otherwise spent in pulp mills
                    </span>
                  </div>

                  <div className="bg-[#05170f] p-3 rounded-xl border border-[#8fe77d]/20">
                    <span className="text-[10px] text-[#8fe77d] font-mono uppercase font-bold block">
                      🌳 Timber & Nature Saved
                    </span>
                    <strong className="text-base text-[#8fe77d] font-mono mt-0.5 block">
                      ~{(aiScanResult.estimatedWeightKg * 1.4).toFixed(2)} kg
                    </strong>
                    <span className="text-[10px] text-[#a4b9a8] block mt-0.5">
                      Prevents raw timber cutting & deforestation
                    </span>
                  </div>

                  <div className="bg-[#05170f] p-3 rounded-xl border border-[#f4cc69]/20">
                    <span className="text-[10px] text-[#f4cc69] font-mono uppercase font-bold block">
                      🇮🇳 Kabadiwala Cash Earned
                    </span>
                    <strong className="text-base text-[#f4cc69] font-mono mt-0.5 block">
                      ₹{Number(((aiScanResult.kabadiwalaPriceInrPerKg || 14) * aiScanResult.estimatedWeightKg).toFixed(1))} INR
                    </strong>
                    <span className="text-[10px] text-[#a4b9a8] block mt-0.5">
                      Direct payout from local garbage collector
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Kabadiwala Scrap Calculator Widget */}
              <KabadiwalaScrapCalculator
                initialKg={aiScanResult.estimatedWeightKg}
                initialType={
                  aiScanResult.materialType.toLowerCase().includes('plastic')
                    ? 'plastic'
                    : aiScanResult.materialType.toLowerCase().includes('aluminum')
                    ? 'metal_aluminum'
                    : aiScanResult.materialType.toLowerCase().includes('metal') || aiScanResult.materialType.toLowerCase().includes('iron')
                    ? 'metal_iron'
                    : 'paper_cardboard'
                }
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="muted">Click &quot;Run Vision AI Analysis&quot; above to scan your uploaded photo.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
