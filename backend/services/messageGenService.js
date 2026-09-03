const generateMessageContent = (incident, language = 'en', accessibility = 'standard', citizen = {}) => {
  const affectedRoutes = Array.isArray(incident.affected_routes_json)
    ? incident.affected_routes_json
    : typeof incident.affected_routes_json === 'string'
    ? JSON.parse(incident.affected_routes_json || '[]')
    : [];

  const mainRoute = affectedRoutes[0] || 'Main Transit Route';
  const locationName = citizen.area || incident.title.split(' ')[0] || 'your area';

  // 1. Language Dictionaries
  const templates = {
    en: {
      subject: `🚨 ${incident.type.toUpperCase()} ALERT: ${locationName}`,
      standard: `${incident.title} reported near ${locationName}. ${mainRoute} is currently restricted/closed. Recommended action: ${incident.recommended_action || 'Take precautions and use alternate routes.'}`,
      simplified: `Emergency in ${locationName}. ${mainRoute} is closed. ${incident.recommended_action || 'Use alternate route.'}`,
      screen_reader: `ALERT SUMMARY: ${incident.type.toUpperCase()} in ${locationName}. ROAD STATUS: ${mainRoute} closed. ACTION: ${incident.recommended_action || 'Use alternate route.'} Helpline: ${incident.emergency_contact || '1077'}.`,
      large_text: `🚨 EMERGENCY ADVISORY 🚨\nLocation: ${locationName}\nStatus: ${mainRoute} CLOSED\nAction: ${incident.recommended_action || 'Avoid the area.'}`,
      high_contrast: `CRITICAL NOTICE: ${incident.title}. Location: ${locationName}. Avoid ${mainRoute}. Helpline: ${incident.emergency_contact || '1077'}.`,
      audio: `Attention resident. Emergency alert for ${locationName}. ${mainRoute} is closed. Please follow recommended action: ${incident.recommended_action || 'Use alternate route.'}`
    },
    ta: {
      subject: `🚨 அவசர எச்சரிக்கை: ${locationName}`,
      standard: `${locationName} பகுதியில் ${incident.title} ஏற்பட்டுள்ளது. ${mainRoute} தற்போது மூடப்பட்டுள்ளது. மாற்று வழியை பயன்படுத்தவும்: ${incident.recommended_action || 'பாதுகாப்பான இடத்திற்கு செல்லவும்.'}`,
      simplified: `${locationName} பகுதியில் அவசர நிலை. ${mainRoute} மூடப்பட்டுள்ளது. மாற்று வழியை பயன்படுத்தவும்.`,
      screen_reader: `எச்சரிக்கை சுருக்கம்: ${locationName} பகுதியில் ஆபத்து. சாலை நிலை: ${mainRoute} மூடப்பட்டுள்ளது. நடவடிக்கை: ${incident.recommended_action || 'மாற்று வழியை பயன்படுத்தவும்.'} உதவி எண்: ${incident.emergency_contact || '1077'}.`,
      large_text: `🚨 அவசர அறிவிப்பு 🚨\nஇடம்: ${locationName}\nநிலை: ${mainRoute} மூடப்பட்டுள்ளது\nநடவடிக்கை: மாற்று வழியை பயன்படுத்தவும்.`,
      high_contrast: `முக்கிய அறிவிப்பு: ${incident.title}. இடம்: ${locationName}. ${mainRoute} தவிர்க்கவும். உதவி எண்: ${incident.emergency_contact || '1077'}.`,
      audio: `கவனத்திற்கு: ${locationName} பகுதியில் அவசர எச்சரிக்கை. ${mainRoute} மூடப்பட்டுள்ளது. தயவுசெய்து மாற்று வழியை பயன்படுத்தவும்.`
    },
    hi: {
      subject: `🚨 आपात्कालीन चेतावनी: ${locationName}`,
      standard: `${locationName} के पास ${incident.title} की सूचना है। ${mainRoute} वर्तमान में बंद है। अनुशंसित कार्रवाई: ${incident.recommended_action || 'वैकल्पिक मार्ग का उपयोग करें।'}`,
      simplified: `${locationName} में आपातकाल। ${mainRoute} बंद है। वैकल्पिक मार्ग का उपयोग करें।`,
      screen_reader: `चेतावनी सारांश: ${locationName} में ${incident.type}। सड़क स्थिति: ${mainRoute} बंद। कार्रवाई: ${incident.recommended_action || 'वैकल्पिक मार्ग लें।'} हेल्पलाइन: ${incident.emergency_contact || '1077'}।`,
      large_text: `🚨 आपातकालीन सलाह 🚨\nस्थान: ${locationName}\nस्थिति: ${mainRoute} बंद\nकार्रवाई: वैकल्पिक मार्ग का प्रयोग करें।`,
      high_contrast: `महत्वपूर्ण सूचना: ${incident.title}। स्थान: ${locationName}। ${mainRoute} से बचें। हेल्पलाइन: ${incident.emergency_contact || '1077'}।`,
      audio: `कृपया ध्यान दें। ${locationName} के लिए आपातकालीन अलर्ट। ${mainRoute} बंद है। कृपया वैकल्पिक मार्ग का उपयोग करें।`
    }
  };

  const langPack = templates[language] || templates.en;
  const content = langPack[accessibility] || langPack.standard;
  const subject = langPack.subject;

  return { subject, content };
};

module.exports = {
  generateMessageContent
};
