import type { Incident, User, Message, LanguageCode, AccessibilityFormat } from '../db/types';

// Multi-lingual terminology dictionary for custom incidents
const TYPE_LABELS: Record<string, { en: string; ta: string; hi: string }> = {
  flood: { en: 'Flooding', ta: 'வெள்ளப்பெருக்கு', hi: 'बाढ़' },
  cyclone: { en: 'Cyclone Alert', ta: 'புயல் எச்சரிக்கை', hi: 'चक्रवात चेतावनी' },
  earthquake: { en: 'Earthquake Tremors', ta: 'நிலநடுக்க அதிர்வுகள்', hi: 'भूकंप के झटके' },
  fire: { en: 'Fire Outbreak', ta: 'தீ விபத்து', hi: 'आग लगना' },
  landslide: { en: 'Landslide / Rockfall', ta: 'மண் சரிவு / பாறை சரிவு', hi: 'भूस्खलन' },
  road_closure: { en: 'Road Blockage', ta: 'சாலை மறியல் / அடைப்பு', hi: 'सड़क मार्ग बंद' },
  public_transport_disruption: { en: 'Transit Disruption', ta: 'போக்குவரத்து தடை', hi: 'परिवहन व्यवधान' },
  power_outage: { en: 'Power Outage', ta: 'மின் தடை', hi: 'बिजली कटौती' },
  water_supply_disruption: { en: 'Water Supply Disruption', ta: 'குடிநீர் விநியோக தடை', hi: 'जलापूर्ति व्यवधान' },
  communication_outage: { en: 'Network Blackout', ta: 'தொடர்பு சேவை முடக்கம்', hi: 'संचार आउटेज' },
  evacuation: { en: 'Evacuation Directive', ta: 'வெளியேற்ற உத்தரவு', hi: 'निकासी निर्देश' },
  extreme_weather: { en: 'Severe Weather Warning', ta: 'கடுமையான வானிலை எச்சரிக்கை', hi: 'गंभीर मौसम चेतावनी' }
};

const SEVERITY_LABELS: Record<string, { en: string; ta: string; hi: string }> = {
  low: { en: 'INFO ALERT', ta: 'தகவல் அறிவிப்பு', hi: 'सामान्य सूचना' },
  medium: { en: 'ADVISORY WARNING', ta: 'ஆலோசனை எச்சரிக்கை', hi: 'सलाह चेतावनी' },
  high: { en: 'DANGER ALERT', ta: 'ஆபத்து எச்சரிக்கை', hi: 'खतरा चेतावनी' },
  critical: { en: 'CRITICAL EMERGENCY ORDER', ta: 'அவசரகால அவசர உத்தரவு', hi: 'आपातकालीन निर्देश' }
};

/**
 * Failure Case 2: Check if requested language is supported.
 * Returns the fallback language code (English) and sets a flag if fallback is triggered.
 */
export const checkLanguageFallback = (lang: string): { finalLang: LanguageCode; isFallback: boolean } => {
  const supported = ['en', 'ta', 'hi'];
  if (supported.includes(lang)) {
    return { finalLang: lang as LanguageCode, isFallback: false };
  }
  // Fallback to english
  return { finalLang: 'en', isFallback: true };
};

/**
 * Generates personalized message text for a citizen based on their language and accessibility settings.
 */
export const generateMessageContent = (
  incident: Incident,
  lang: LanguageCode,
  format: AccessibilityFormat,
  citizen?: User
): { subject: string; content: string; warningText?: string } => {
  
  // Determine language fallback (Failure Case 2 simulation helper)
  const langCheck = checkLanguageFallback(lang);
  const finalLang = langCheck.finalLang;
  const isFallbackTriggered = langCheck.isFallback;

  const typeName = TYPE_LABELS[incident.type]?.[finalLang] || incident.type;
  const severityName = SEVERITY_LABELS[incident.severity]?.[finalLang] || incident.severity;
  const routesStr = incident.affectedRoutes.length > 0 ? incident.affectedRoutes.join(', ') : 'None';
  
  let subject = '';
  let content = '';

  // -------------------------------------------------------------
  // ENGLISH GENERATOR
  // -------------------------------------------------------------
  if (finalLang === 'en') {
    subject = `[${severityName}] ${incident.title}`;
    
    switch (format) {
      case 'simplified':
        content = `ALERT: ${typeName} reported. Location: near incident coordinates. Area: ${citizen?.area || 'Your local sector'}. Status: Active.
- Problem: ${incident.description.split('.')[0]}.
- Routes blocked: ${routesStr}.
- What to do: ${incident.recommendedAction}.
- Emergency call: ${incident.emergencyContact}.`;
        break;
        
      case 'large_text':
        content = `*** CRITICAL EMERGENCY WARNING ***
INCIDENT: ${typeName.toUpperCase()}
WHERE: NEAR ${citizen?.area?.toUpperCase() || 'YOUR SECTOR'}
SEVERITY: ${incident.severity.toUpperCase()}
ACTION REQUIRED: ${incident.recommendedAction.toUpperCase()}
EMERGENCY LINE: ${incident.emergencyContact}
UPDATED AT: ${new Date(incident.lastUpdated).toLocaleTimeString()}`;
        break;
        
      case 'high_contrast':
        content = `[!] ATTENTION REQUIRED: ${typeName}
======================================
INCIDENT LOCATION: Near ${citizen?.area || 'Your sector'}
SEVERITY LEVEL: ${incident.severity.toUpperCase()}
DISRUPTION DETAILS: ${incident.description}
ROUTS AFFECTED: ${routesStr}
URGENT ACTION: ${incident.recommendedAction}
EMERGENCY ASSISTANCE: ${incident.emergencyContact}
======================================`;
        break;

      case 'screen_reader':
        content = `System Notification. Level: ${severityName}. Category: ${typeName}. 
Headline: ${incident.title}. 
Geographic location matches your profile coordinates. Details of disruption: ${incident.description}. 
Active route closures include: ${routesStr}. 
Required safety protocol for residents: ${incident.recommendedAction}. 
For urgent help, contact the command line at: ${incident.emergencyContact}. 
End of notification.`;
        break;

      case 'audio':
        content = `Attention. This is the Crisis Connect public broadcast. A ${incident.severity} disruption, categorized as ${typeName}, has occurred near ${citizen?.area || 'your local area'}. Current details: ${incident.description}. Please note that traffic is disrupted on ${routesStr}. You are advised to take the following action immediately: ${incident.recommendedAction}. For assistance, contact ${incident.emergencyContact}. Thank you.`;
        break;

      case 'standard':
      default:
        content = `A ${incident.severity} severity ${typeName} has been reported.
Location details: Coordinates (${incident.lat}, ${incident.lng}), affecting ${citizen?.area || 'the general area'}.
Details: ${incident.description}
Affected Routes: ${routesStr}
Affected Services: ${incident.affectedServices.join(', ')}
Recommended Action: ${incident.recommendedAction}
Emergency Contact: ${incident.emergencyContact}
Reported at: ${new Date(incident.startTime).toLocaleTimeString()} | Last Updated: ${new Date(incident.lastUpdated).toLocaleTimeString()}`;
        break;
    }
  } 
  // -------------------------------------------------------------
  // TAMIL GENERATOR
  // -------------------------------------------------------------
  else if (finalLang === 'ta') {
    subject = `[${severityName}] ${typeName}: ${incident.title}`;
    
    // Tamil translation mappings for recommended actions & details (custom mock translations for seed data)
    let taDesc = incident.description;
    let taAction = incident.recommendedAction;
    let taArea = citizen?.area || 'உங்கள் பகுதி';

    if (incident.id === 'inc-1') {
      taDesc = 'தொடர் கனமழை காரணமாக பல இடங்களில் கடுமையான வெள்ளப்பெருக்கு ஏற்பட்டுள்ளது. குடியிருப்பு பகுதிகளில் தண்ணீர் 3 அடி வரை சூழ்ந்துள்ளது.';
      taAction = 'தரை தளங்களில் வசிப்பவர்கள் வெளியேறவும். அண்ணா நகர் நகராட்சி பள்ளியில் அமைக்கப்பட்டுள்ள தற்காலிக முகாம்களுக்கு செல்லவும்.';
      taArea = 'அண்ணா நகர்';
    } else if (incident.id === 'inc-2') {
      taDesc = 'புயல் சின்னம் காரணமாக கனமழை பெய்து வருகிறது. அடையாறு ஆற்றில் நீர்மட்டம் அபாய அளவை எட்டியுள்ளது.';
      taAction = 'அவசர தேவைகளுக்கான பொருட்களை தயார் நிலையில் வைக்கவும். கூரைகளை பாதுகாப்பாக வைத்திருக்கவும்.';
      taArea = 'அடையாறு';
    } else if (incident.id === 'inc-3') {
      taDesc = 'உஸ்மான் சாலை அருகே மரங்கள் விழுந்ததால் 18-வது தடத்தில் போக்குவரத்து முற்றிலும் பாதிக்கப்பட்டுள்ளது. அகற்றும்பணி நடக்கிறது.';
      taAction = '47-வது தடத்தை பயன்படுத்தவும் அல்லது சென்னை மெட்ரோவை பயன்படுத்தவும்.';
      taArea = 'தி. நகர்';
    } else if (incident.id === 'inc-4') {
      taDesc = 'மின்னழுத்தம் காரணமாக மின்மாற்றியில் தீ விபத்து ஏற்பட்டது. சரிசெய்யும் பணிகள் நடைபெறும் வரை மின் இணைப்பு தற்காலிகமாக துண்டிக்கப்பட்டுள்ளது.';
      taAction = 'கிண்டி மின் நிலையத்தின் அருகே செல்ல வேண்டாம். மின்சார சாதனங்களை அணைத்து வைக்கவும்.';
      taArea = 'கிண்டி';
    }

    switch (format) {
      case 'simplified':
        content = `வெள்ள அபாயம்: ${typeName} ஏற்பட்டுள்ளது. இடம்: ${taArea}. நிலை: தீவிரமானது.
- பாதிப்பு: ${taDesc.split('।')[0] || taDesc.split('.')[0]}.
- தடையுள்ள பாதைகள்: ${routesStr}.
- என்ன செய்ய வேண்டும்: ${taAction}.
- உதவி எண்: ${incident.emergencyContact}.`;
        break;
        
      case 'large_text':
        content = `*** அவசர எச்சரிக்கை ***
பாதிப்பு வகை: ${typeName.toUpperCase()}
இடம்: ${taArea.toUpperCase()} அருகில்
தீவிரம்: ${incident.severity.toUpperCase()}
செய்ய வேண்டியவை: ${taAction.toUpperCase()}
அவசர உதவி எண்: ${incident.emergencyContact}`;
        break;
        
      case 'high_contrast':
        content = `[!] முக்கிய அறிவிப்பு: ${typeName}
======================================
பாதிக்கப்பட்ட பகுதி: ${taArea} அருகில்
தீவிரத்தன்மை: ${incident.severity.toUpperCase()}
பாதிப்பு விவரம்: ${taDesc}
தடைபட்டுள்ள வழிகள்: ${routesStr}
பாதுகாப்பு நடவடிக்கை: ${taAction}
அவசர உதவி எண்: ${incident.emergencyContact}
======================================`;
        break;

      case 'screen_reader':
        content = `பொது எச்சரிக்கை. அலர்ட் வகை: ${typeName}. தீவிரம்: ${severityName}.
தலைப்பு: ${incident.title}. 
உங்கள் இருப்பிடத்திற்கு அருகில் இந்த பாதிப்பு பதிவாகியுள்ளது. விவரம்: ${taDesc}.
பாதிக்கப்பட்ட பேருந்து வழித்தடங்கள்: ${routesStr}.
பரிந்துரைக்கப்பட்ட பாதுகாப்பு நடவடிக்கை: ${taAction}.
உதவிக்கு தொடர்பு கொள்ள வேண்டிய எண்: ${incident.emergencyContact}. அறிவிப்பு நிறைவுற்றது.`;
        break;

      case 'audio':
        content = `கவனிக்கவும். இது கிரைசிஸ் கனெக்ட் அவசர எச்சரிக்கை சேவை. உங்கள் பகுதிக்கு அருகில் ${typeName} பாதிப்பு பதிவாகியுள்ளது. தற்போதைய விவரம்: ${taDesc}. ${routesStr} வழித்தடத்தில் போக்குவரத்து தடை செய்யப்பட்டுள்ளது. தயவுசெய்து உடனடியாக இந்த பாதுகாப்பு நடவடிக்கையை மேற்கொள்ளவும்: ${taAction}. அவசர உதவிக்கு இந்த எண்ணை தொடர்பு கொள்ளவும் ${incident.emergencyContact}. நன்றி.`;
        break;

      case 'standard':
      default:
        content = `${severityName} - ${typeName} பதிவாகியுள்ளது.
பாதிக்கப்பட்ட பகுதி: ${taArea} (இருப்பிட ஆயத்தொலைவுகள்: ${incident.lat}, ${incident.lng})
பாதிப்பு விவரம்: ${taDesc}
பாதிக்கப்பட்ட போக்குவரத்து பாதைகள்: ${routesStr}
பாதிக்கப்பட்ட சேவைகள்: ${incident.affectedServices.join(', ')}
செய்ய வேண்டிய பாதுகாப்பு நடவடிக்கை: ${taAction}
அவசர உதவிக்கு தொடர்பு கொள்ள வேண்டிய எண்: ${incident.emergencyContact}
துவங்கப்பட்ட நேரம்: ${new Date(incident.startTime).toLocaleTimeString()} | கடைசியாக புதுப்பிக்கப்பட்டது: ${new Date(incident.lastUpdated).toLocaleTimeString()}`;
        break;
    }
  } 
  // -------------------------------------------------------------
  // HINDI GENERATOR
  // -------------------------------------------------------------
  else {
    subject = `[${severityName}] ${typeName}: ${incident.title}`;
    
    // Hindi translation mappings
    let hiDesc = incident.description;
    let hiAction = incident.recommendedAction;
    let hiArea = citizen?.area || 'आपका क्षेत्र';

    if (incident.id === 'inc-1') {
      hiDesc = 'लगातार भारी बारिश के कारण गंभीर जलभराव हो गया है। निचले इलाकों में पानी 3 फीट तक पहुंच गया है।';
      hiAction = 'ग्राउंड फ्लोर खाली करें। अन्ना नगर म्युनिसिपल स्कूल में बने आश्रय गृह में जाएं।';
      hiArea = 'अन्ना नगर';
    } else if (incident.id === 'inc-2') {
      hiDesc = 'चक्रवात के प्रभाव से भारी वर्षा हो रही है। अड्यार नदी का जलस्तर खतरे के निशान के पास पहुंच गया है।';
      hiAction = 'आपातकालीन सामग्री तैयार रखें। छतों को सुरक्षित करें।';
      hiArea = 'अड्यार';
    } else if (incident.id === 'inc-3') {
      hiDesc = 'उस्मान रोड के पास पेड़ गिरने से मार्ग 18 पूरी तरह अवरुद्ध हो गया है। मलबा हटाया जा रहा है।';
      hiAction = 'मार्ग 47 का प्रयोग करें या चेन्नई मेट्रो सेवा लें।';
      hiArea = 'टी नगर';
    } else if (incident.id === 'inc-4') {
      hiDesc = 'सबस्टेशन ट्रांसफार्मर फटने से बिजली कटौती। मरम्मत होने तक बिजली आपूर्ति अस्थाई रूप से बंद है।';
      hiAction = 'गिंडी इंडस्ट्रियल एस्टेट सबस्टेशन के पास न जाएं। भारी उपकरण बंद कर दें।';
      hiArea = 'गिंडी';
    }

    switch (format) {
      case 'simplified':
        content = `चेतावनी: ${typeName} की सूचना है। स्थान: ${hiArea}। स्थिति: गंभीर।
- समस्या: ${hiDesc.split('.')[0]}।
- बंद मार्ग: ${routesStr}।
- क्या करें: ${hiAction}।
- आपातकालीन संपर्क: ${incident.emergencyContact}।`;
        break;
        
      case 'large_text':
        content = `*** आपातकालीन चेतावनी ***
घटना प्रकार: ${typeName.toUpperCase()}
प्रभावित क्षेत्र: ${hiArea.toUpperCase()} के पास
गंभीरता: ${incident.severity.toUpperCase()}
आवश्यक कार्रवाई: ${hiAction.toUpperCase()}
हेल्पलाइन नंबर: ${incident.emergencyContact}`;
        break;
        
      case 'high_contrast':
        content = `[!] ध्यान दें: ${typeName}
======================================
स्थान: ${hiArea} के पास
गंभीरता स्तर: ${incident.severity.toUpperCase()}
विवरण: ${hiDesc}
प्रभावित मार्ग: ${routesStr}
सुरक्षा उपाय: ${hiAction}
आपातकालीन संपर्क: ${incident.emergencyContact}
======================================`;
        break;

      case 'screen_reader':
        content = `सार्वजनिक चेतावनी। घटना श्रेणी: ${typeName}। गंभीरता स्तर: ${severityName}।
शीर्षक: ${incident.title}।
यह घटना आपके पंजीकृत क्षेत्र के पास हुई है। विवरण: ${hiDesc}।
प्रभावित मार्ग हैं: ${routesStr}।
आवश्यक कार्रवाई: ${hiAction}।
आपातकालीन सहायता के लिए डायल करें: ${incident.emergencyContact}। घोषणा समाप्त।`;
        break;

      case 'audio':
        content = `ध्यान दें। यह क्राइसिस कनेक्ट सार्वजनिक चेतावनी सेवा है। आपके क्षेत्र के पास ${typeName} की स्थिति बनी हुई है। वर्तमान विवरण है: ${hiDesc}। यातायात मार्ग ${routesStr} पर अवरुद्ध है। आपसे अनुरोध है कि तुरंत यह सुरक्षा कार्रवाई करें: ${hiAction}। आपातकालीन मदद के लिए ${incident.emergencyContact} पर कॉल करें। धन्यवाद।`;
        break;

      case 'standard':
      default:
        content = `${severityName} - ${typeName} की सूचना प्राप्त हुई है।
स्थान विवरण: निर्देशांक (${incident.lat}, ${incident.lng}), प्रभावित क्षेत्र: ${hiArea} के पास।
विवरण: ${hiDesc}
प्रभावित मार्ग: ${routesStr}
प्रभावित सेवाएं: ${incident.affectedServices.join(', ')}
अनुशंसित कार्रवाई: ${hiAction}
आपातकालीन संपर्क: ${incident.emergencyContact}
प्रारंभ समय: ${new Date(incident.startTime).toLocaleTimeString()} | अंतिम अपडेट: ${new Date(incident.lastUpdated).toLocaleTimeString()}`;
        break;
    }
  }

  // Construct warning text for Fallback indications (Failure Case 2 requirement)
  let warningText = undefined;
  if (isFallbackTriggered) {
    warningText = `Requested language "${lang.toUpperCase()}" was unavailable. English fallback has been used.`;
  }

  return { subject, content, warningText };
};

/**
 * Builds the explanation object (Why was this citizen targeted? Why was this format chosen?)
 */
export const generateExplanation = (citizen: User, incident: Incident, distanceKm?: number): Message['explanation'] => {
  const isLocationMatch = distanceKm !== undefined ? distanceKm <= incident.radius : false;
  const isRouteMatch = citizen.route ? incident.affectedRoutes.some(r => r.toLowerCase().trim() === citizen.route?.toLowerCase().trim()) : false;

  const severityReason = `Incident severity is ${incident.severity.toUpperCase()}.`;
  const languageReason = `Citizen uses ${citizen.language.toUpperCase()} as preferred language.`;
  const accessibilityReason = `Citizen selected "${citizen.accessibility.toUpperCase()}" communication format.`;

  return {
    locationMatch: isLocationMatch,
    routeMatch: isRouteMatch,
    distance: distanceKm,
    severityReason,
    languageReason,
    accessibilityReason
  };
};

/**
 * Baseline communication generator (Failure Case 1 & Proposed comparison)
 * Emits a single generic message sent to everyone.
 */
export const generateBaselineMessage = (): { subject: string; content: string } => {
  return {
    subject: 'Emergency Alert: Disruption In Your Area',
    content: 'Emergency: There is a disruption in your area. Please take necessary precautions and follow guidance from local responders.'
  };
};
