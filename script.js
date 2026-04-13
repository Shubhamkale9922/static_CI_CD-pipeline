
// TOTAL VOTING SYSTEM - Core Logic
// --------------------------------
// Features: Real-time voting, local storage persistence,
// Export results, Reset election, One-vote-per-session lock.

// ---------- DATA MODEL ----------
const CANDIDATES_DATA = [
  { id: 1, name: "Dr. Elena Voss", party: "Progressive Future", avatar: "🌿", shortBio: "Climate & Innovation" },
  { id: 2, name: "Marcus Chen", party: "Unity Coalition", avatar: "⚖️", shortBio: "Economic Reform" },
  { id: 3, name: "Sofia Rivera", party: "People's Voice", avatar: "🗳️", shortBio: "Social Equality" },
  { id: 4, name: "James Okafor", party: "New Horizons", avatar: "🚀", shortBio: "Tech & Education" }
];

// Global state
let votes = [];        // array of { candidateId, timestamp }
let hasVoted = false;  // session lock (one vote per session, but reset will clear)
let selectedCandidateId = null;

// DOM elements
const candidatesContainer = document.getElementById('candidatesList');
const resultsContainer = document.getElementById('resultsContainer');
const submitBtn = document.getElementById('submitVoteBtn');
const resetBtn = document.getElementById('resetSystemBtn');
const exportBtn = document.getElementById('exportResultsBtn');
const voteFeedback = document.getElementById('voteFeedback');
const totalVotesBadge = document.getElementById('totalVotesBadge');

// ---------- HELPER: Load/Save to localStorage ----------
function loadVotesFromStorage() {
  const storedVotes = localStorage.getItem('totalVoteSystem_votes');
  const storedHasVoted = localStorage.getItem('totalVoteSystem_hasVoted');
  
  if (storedVotes) {
    try {
      votes = JSON.parse(storedVotes);
    } catch(e) { votes = []; }
  } else {
    votes = [];
  }
  
  if (storedHasVoted !== null) {
    hasVoted = storedHasVoted === 'true';
  } else {
    hasVoted = false;
  }
  
  // extra security: if votes length > 0 and hasVoted is false but votes exist -> sync
  if (votes.length > 0 && !hasVoted) {
    hasVoted = true;
    saveStateToLocal();
  }
  if (votes.length === 0 && hasVoted) {
    hasVoted = false;
    saveStateToLocal();
  }
}

function saveStateToLocal() {
  localStorage.setItem('totalVoteSystem_votes', JSON.stringify(votes));
  localStorage.setItem('totalVoteSystem_hasVoted', hasVoted.toString());
}

// ---------- Core Vote Functions ----------
function castVote(candidateId) {
  if (hasVoted) {
    showFeedback('⚠️ You have already voted! Reset election to vote again.', 'error');
    return false;
  }
  
  const candidateExists = CANDIDATES_DATA.find(c => c.id === candidateId);
  if (!candidateExists) {
    showFeedback('Invalid candidate selection.', 'error');
    return false;
  }
  
  // Record vote
  const newVote = {
    candidateId: candidateId,
    timestamp: Date.now()
  };
  votes.push(newVote);
  hasVoted = true;
  saveStateToLocal();
  
  // Update UI
  renderCandidatesList();
  renderResults();
  updateTotalBadge();
  showFeedback(`✅ Vote cast for ${candidateExists.name}! Thank you for participating.`, 'success');
  
  // deselect any highlight
  selectedCandidateId = null;
  return true;
}

function resetElection() {
  if (votes.length > 0 || hasVoted) {
    votes = [];
    hasVoted = false;
    selectedCandidateId = null;
    saveStateToLocal();
    renderCandidatesList();
    renderResults();
    updateTotalBadge();
    showFeedback('🗳️ Election has been reset. All votes cleared. You can vote again!', 'info');
  } else {
    showFeedback('No active votes to clear. System already clean.', 'info');
  }
}

function exportResultsJSON() {
  const totalVotesCount = votes.length;
  const candidateStats = CANDIDATES_DATA.map(candidate => {
    const voteCount = votes.filter(v => v.candidateId === candidate.id).length;
    const percentage = totalVotesCount === 0 ? 0 : ((voteCount / totalVotesCount) * 100).toFixed(2);
    return {
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      votes: voteCount,
      percentage: parseFloat(percentage)
    };
  });
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalVotes: totalVotesCount,
    results: candidateStats,
    rawVotes: votes.map(v => ({ candidateId: v.candidateId, timestamp: v.timestamp }))
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `election_results_${new Date().toISOString().slice(0,19)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showFeedback('📁 Results exported as JSON file.', 'success');
}

// ---------- UI Rendering (candidates + live results) ----------
function renderCandidatesList() {
  if (!candidatesContainer) return;
  
  candidatesContainer.innerHTML = '';
  CANDIDATES_DATA.forEach(candidate => {
    const voteCountForThis = votes.filter(v => v.candidateId === candidate.id).length;
    const candidateDiv = document.createElement('div');
    candidateDiv.className = `candidate-option ${selectedCandidateId === candidate.id ? 'selected' : ''}`;
    candidateDiv.setAttribute('data-id', candidate.id);
    
    candidateDiv.innerHTML = `
      <div class="candidate-info">
        <div class="candidate-avatar">${candidate.avatar}</div>
        <div>
          <div class="candidate-name">${candidate.name}</div>
          <div class="candidate-bio">${candidate.party} · ${candidate.shortBio}</div>
        </div>
      </div>
      <div class="vote-badge">
        <i class="fas fa-chart-line"></i> ${voteCountForThis} votes
      </div>
    `;
    
    // Click to select (only if hasn't voted yet)
    candidateDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      if (hasVoted) {
        showFeedback('You already voted. Reset system to change your vote.', 'error');
        return;
      }
      // update selected style
      selectedCandidateId = candidate.id;
      renderCandidatesList();  // re-render to show selection
    });
    
    candidatesContainer.appendChild(candidateDiv);
  });
  
  // Disable selection visuals if already voted (disable click selection after vote)
  if (hasVoted) {
    const allOptions = document.querySelectorAll('.candidate-option');
    allOptions.forEach(opt => {
      opt.style.cursor = 'not-allowed';
      opt.style.opacity = '0.8';
    });
  } else {
    const allOptions = document.querySelectorAll('.candidate-option');
    allOptions.forEach(opt => opt.style.cursor = 'pointer');
  }
}

function renderResults() {
  if (!resultsContainer) return;
  
  const totalVotesCast = votes.length;
  const resultsArray = CANDIDATES_DATA.map(candidate => {
    const count = votes.filter(v => v.candidateId === candidate.id).length;
    const percent = totalVotesCast === 0 ? 0 : ((count / totalVotesCast) * 100).toFixed(1);
    return {
      ...candidate,
      voteCount: count,
      percentage: parseFloat(percent)
    };
  });
  
  // sort by vote count descending (optional)
  resultsArray.sort((a,b) => b.voteCount - a.voteCount);
  
  resultsContainer.innerHTML = '';
  resultsArray.forEach(candidate => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    const percentDisplay = totalVotesCast === 0 ? 0 : candidate.percentage;
    const fillWidth = percentDisplay;
    
    resultItem.innerHTML = `
      <div class="result-header">
        <div class="result-name">
          <i class="fas fa-user-circle"></i> ${candidate.name}
          <span style="font-size:0.7rem; background:#eef2f5; padding:2px 8px; border-radius:20px;">${candidate.party}</span>
        </div>
        <div class="result-votes">${candidate.voteCount} vote${candidate.voteCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-fill" style="width: ${fillWidth}%;"></div>
      </div>
      <div class="percentage">${percentDisplay}% of total</div>
    `;
    resultsContainer.appendChild(resultItem);
  });
  
  // show special message if no votes
  if (totalVotesCast === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'result-item';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.padding = '1.5rem';
    emptyMsg.innerHTML = '<i class="fas fa-chart-simple"></i> No votes cast yet. Be the first!';
    resultsContainer.appendChild(emptyMsg);
  }
}

function updateTotalBadge() {
  const total = votes.length;
  if (totalVotesBadge) {
    totalVotesBadge.innerText = `${total} vote${total !== 1 ? 's' : ''}`;
  }
}

function showFeedback(message, type = 'info') {
  if (!voteFeedback) return;
  voteFeedback.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i> ${message}`;
  voteFeedback.className = `feedback-msg feedback-${type}`;
  voteFeedback.style.color = type === 'error' ? '#b33' : type === 'success' ? '#1f6e5c' : '#2c6285';
  voteFeedback.style.backgroundColor = type === 'error' ? '#ffe6e6' : type === 'success' ? '#e0f7f2' : '#eef3fc';
  voteFeedback.style.padding = '10px';
  voteFeedback.style.borderRadius = '60px';
  
  setTimeout(() => {
    if (voteFeedback.innerHTML.includes(message)) {
      // keep but no auto clear if it's success after 3 sec? just remove style overlay but keep last? We'll fade message after 3 sec
      setTimeout(() => {
        if (voteFeedback.innerHTML.includes(message)) {
          voteFeedback.style.opacity = '0.7';
        }
      }, 2800);
    }
  }, 100);
}

// ---------- Submit vote handler ----------
function handleSubmitVote() {
  if (hasVoted) {
    showFeedback('❌ You have already voted! Use reset to start a new voting session.', 'error');
    return;
  }
  
  if (selectedCandidateId === null) {
    showFeedback('❗ Please select a candidate before submitting your vote.', 'error');
    return;
  }
  
  castVote(selectedCandidateId);
  // after vote, clear selection and update UI
  selectedCandidateId = null;
  renderCandidatesList();
}

// ---------- Event Listeners ----------
function bindEvents() {
  if (submitBtn) submitBtn.addEventListener('click', handleSubmitVote);
  if (resetBtn) resetBtn.addEventListener('click', resetElection);
  if (exportBtn) exportBtn.addEventListener('click', exportResultsJSON);
}

// ---------- Initialization ----------
function init() {
  loadVotesFromStorage();
  bindEvents();
  renderCandidatesList();
  renderResults();
  updateTotalBadge();
  
  // extra sync for visual after storage loaded
  if (hasVoted) {
    selectedCandidateId = null;
    renderCandidatesList();
  }
}

// start the voting system
init();
