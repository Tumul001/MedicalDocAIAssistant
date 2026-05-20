import re

with open("frontend/src/components/voice/VoiceAssistant.jsx", "r") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';\nimport { useDocument } from '../../context/DocumentContext';\nimport { sendChatMessage } from '../../services/api';",
    "import { useVoiceChat } from '../../hooks/useVoiceChat';\nimport { useDocument } from '../../context/DocumentContext';"
)

# 2. State & Hooks
old_state = """  const { documentLoaded, addChatMessage } = useDocument();
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [speechSupport] = useState(() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const { isRecording, formattedDuration, startRecording, stopRecording, cancelRecording, error: recError } = useVoiceRecorder();"""

new_state = """  const { documentLoaded, addChatMessage } = useDocument();
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const {
    voiceState: hookVoiceState,
    finalText: transcript,
    errorMsg,
    startListening,
    stopListening,
    stopSpeaking,
    clearError
  } = useVoiceChat({
    onTranscript: ({ text }) => {
      addChatMessage({ id: Date.now(), role: 'user', content: text });
    },
    onAnswer: ({ text, confidence, sources }) => {
      setAiResponse(text);
      addChatMessage({ id: Date.now() + 1, role: 'assistant', content: text, confidence, sources });
    }
  });

  const voiceState = errorMsg ? STATE.ERROR : hookVoiceState;"""

content = content.replace(old_state, new_state)

# 3. Handlers
# Use regex to replace everything from startBrowserSTT to handleCancel
handlers_pattern = re.compile(
    r"  // Web Speech API for STT.*?const handleCancel = \(\) => \{.*?\n  \};\n",
    re.DOTALL
)

new_handlers = """  const handleMicPress = async () => {
    if (voiceState === STATE.LISTENING) {
      stopListening();
      return;
    }
    if (voiceState !== STATE.IDLE && voiceState !== STATE.ERROR) return;
    setAiResponse('');
    clearError();
    startListening();
  };

  const handleCancel = () => {
    stopListening();
    stopSpeaking();
    setAiResponse('');
    clearError();
  };
"""

content = handlers_pattern.sub(new_handlers, content)

# 4. JSX tweaks
content = content.replace(
    "{voiceState === STATE.LISTENING && isRecording ? `● ${formattedDuration}  ${cfg.label}` : cfg.label}",
    "{cfg.label}"
)
content = content.replace("{(errorMsg || recError) && (", "{errorMsg && (")
content = content.replace("{errorMsg || recError}", "{errorMsg}")

with open("frontend/src/components/voice/VoiceAssistant.jsx", "w") as f:
    f.write(content)

