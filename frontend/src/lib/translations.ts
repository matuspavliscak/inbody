export const en = {
  // Header
  'header.brand': 'InBody',
  'header.dashboard': 'Dashboard',
  'header.back': '← Back',

  // Toasts
  'toast.processedSuccess': '{name} processed successfully',
  'toast.skippedFiles': 'Skipped unsupported file(s): {names}',
  'toast.scanDeleted': 'Scan deleted',
  'toast.scanUpdated': 'Scan updated',
  'toast.goalsSaved': 'Goals saved',
  'toast.sampleLoaded': 'Sample data loaded',
  'toast.allCleared': 'All data cleared',
  'toast.csvExported': 'CSV exported',

  // Upload
  'upload.scan': 'Upload Scan',
  'upload.processing': 'Processing...',
  'upload.processingProgress': 'Processing {current}/{total}...',

  // Empty state
  'empty.dropTitle': 'Drop InBody scans here',
  'empty.dropDesc': 'PDF or image files - click to browse',
  'empty.or': 'or',
  'empty.loadSample': 'Load sample data to explore',

  // Goals
  'goals.targetWeight': 'Target weight: {value} kg',
  'goals.targetFat': 'Target body fat: {value}%',
  'goals.none': 'No goals set',
  'goals.edit': 'Edit',
  'goals.set': 'Set goals',
  'goals.weightLabel': 'Weight',
  'goals.fatLabel': 'Body Fat %',
  'goals.save': 'Save',
  'goals.cancel': 'Cancel',

  // Stat cards
  'stat.weight': 'Weight',
  'stat.smm': 'SMM',
  'stat.pbf': 'Body Fat %',
  'stat.bmi': 'BMI',
  'stat.inbodyScore': 'InBody Score',

  // Scan list
  'scanList.title': 'All Scans',
  'scanList.exportCsv': 'Export CSV',
  'scanList.clearAll': 'Clear all',
  'scanList.score': 'Score',

  // CSV headers
  'csv.date': 'Date',
  'csv.weight': 'Weight (kg)',
  'csv.smm': 'SMM (kg)',
  'csv.pbf': 'PBF (%)',
  'csv.bmi': 'BMI',
  'csv.inbodyScore': 'InBody Score',
  'csv.sourceFile': 'Source File',

  // Confirm modals
  'confirm.delete': 'Delete',
  'confirm.confirm': 'Confirm',
  'confirm.cancel': 'Cancel',
  'confirm.clearTitle': 'Clear all data',
  'confirm.clearMessage': 'Delete all scans and goals? This cannot be undone.',
  'confirm.deleteScanTitle': 'Delete scan',
  'confirm.deleteScanMessage': 'Delete scan from {date}? This cannot be undone.',

  // Scan detail
  'detail.id': 'ID: {value}',
  'detail.age': 'Age {value}',
  'detail.save': 'Save',
  'detail.edit': 'Edit',
  'detail.delete': 'Delete',
  'detail.inbodyScore': 'InBody Score',

  // Sections
  'section.bodyComposition': 'Body Composition',
  'section.muscleFat': 'Muscle-Fat Analysis',
  'section.obesity': 'Obesity Analysis',
  'section.weightControl': 'Weight Control',
  'section.research': 'Research Parameters',

  // Field labels
  'field.totalBodyWater': 'Total Body Water',
  'field.protein': 'Protein',
  'field.minerals': 'Minerals',
  'field.bodyFatMass': 'Body Fat Mass',
  'field.weight': 'Weight',
  'field.smm': 'Skeletal Muscle Mass',
  'field.bmi': 'BMI',
  'field.pbf': 'Percent Body Fat',
  'field.targetWeight': 'Target Weight',
  'field.weightControl': 'Weight Control',
  'field.fatControl': 'Fat Control',
  'field.muscleControl': 'Muscle Control',
  'field.waistHipRatio': 'Waist-Hip Ratio',
  'field.visceralFatLevel': 'Visceral Fat Level',
  'field.fatFreeMass': 'Fat Free Mass',
  'field.basalMetabolicRate': 'Basal Metabolic Rate',
  'field.obesityDegree': 'Obesity Degree',
  'field.smi': 'SMI',
  'field.recommendedCalories': 'Recommended Calories',

  // Segmental
  'segment.rightArm': 'Right Arm',
  'segment.leftArm': 'Left Arm',
  'segment.trunk': 'Trunk',
  'segment.rightLeg': 'Right Leg',
  'segment.leftLeg': 'Left Leg',
  'segment.leanTitle': 'Segmental Lean Analysis',
  'segment.fatTitle': 'Segmental Fat Analysis',
  'segment.impedance': 'Impedance',
  'segment.frequency': 'Frequency',

  // Composition bar
  'comp.water': 'Water',
  'comp.protein': 'Protein',
  'comp.minerals': 'Minerals',
  'comp.fat': 'Fat',
  'comp.breakdown': 'Body Composition Breakdown',

  // Charts
  'chart.weightMuscle': 'Weight & Muscle',
  'chart.weightKg': 'Weight (kg)',
  'chart.smmKg': 'SMM (kg)',
  'chart.fatMassKg': 'Fat Mass (kg)',
  'chart.fatBmi': 'Body Fat % & BMI',
  'chart.pbfPercent': 'PBF (%)',
  'chart.bmi': 'BMI',
  'chart.goal': 'Goal',
  'chart.needMore': 'Need at least 2 scans to show trends',

  // Glossary
  'glossary.SMM': 'Skeletal Muscle Mass - the total weight of muscles attached to bones',
  'glossary.BMI': 'Body Mass Index - weight (kg) divided by height squared (m²)',
  'glossary.PBF': 'Percent Body Fat - body fat mass as a percentage of total weight',
  'glossary.BFM': 'Body Fat Mass - total weight of fat tissue in the body',
  'glossary.FFM': 'Fat-Free Mass - total weight minus body fat mass',
  'glossary.TBW': 'Total Body Water - total amount of water in the body',
  'glossary.SMI': 'Skeletal Muscle Index - skeletal muscle mass divided by height squared',
  'glossary.BMR': 'Basal Metabolic Rate - calories burned at rest per day',
  'glossary.WHR': 'Waist-Hip Ratio - waist circumference divided by hip circumference',
  'glossary.VFL': 'Visceral Fat Level - estimated fat around internal organs (1-20 scale)',
  'glossary.InBody': 'InBody Score - overall body composition score (0-100)',
} as const;

export type TranslationKey = keyof typeof en;

export const cs: Record<TranslationKey, string> = {
  // Header
  'header.brand': 'InBody',
  'header.dashboard': 'Přehled',
  'header.back': '← Zpět',

  // Toasts
  'toast.processedSuccess': '{name} úspěšně zpracováno',
  'toast.skippedFiles': 'Přeskočeny nepodporované soubory: {names}',
  'toast.scanDeleted': 'Měření smazáno',
  'toast.scanUpdated': 'Měření aktualizováno',
  'toast.goalsSaved': 'Cíle uloženy',
  'toast.sampleLoaded': 'Vzorová data načtena',
  'toast.allCleared': 'Všechna data smazána',
  'toast.csvExported': 'CSV exportováno',

  // Upload
  'upload.scan': 'Nahrát měření',
  'upload.processing': 'Zpracovávám...',
  'upload.processingProgress': 'Zpracovávám {current}/{total}...',

  // Empty state
  'empty.dropTitle': 'Přetáhněte InBody měření sem',
  'empty.dropDesc': 'PDF nebo obrázky - klikněte pro výběr',
  'empty.or': 'nebo',
  'empty.loadSample': 'Načíst vzorová data k prozkoumání',

  // Goals
  'goals.targetWeight': 'Cílová hmotnost: {value} kg',
  'goals.targetFat': 'Cílový tělesný tuk: {value}%',
  'goals.none': 'Žádné cíle nenastaveny',
  'goals.edit': 'Upravit',
  'goals.set': 'Nastavit cíle',
  'goals.weightLabel': 'Hmotnost',
  'goals.fatLabel': 'Tělesný tuk %',
  'goals.save': 'Uložit',
  'goals.cancel': 'Zrušit',

  // Stat cards
  'stat.weight': 'Hmotnost',
  'stat.smm': 'SMM',
  'stat.pbf': 'Tělesný tuk %',
  'stat.bmi': 'BMI',
  'stat.inbodyScore': 'InBody skóre',

  // Scan list
  'scanList.title': 'Všechna měření',
  'scanList.exportCsv': 'Export CSV',
  'scanList.clearAll': 'Smazat vše',
  'scanList.score': 'Skóre',

  // CSV headers
  'csv.date': 'Datum',
  'csv.weight': 'Hmotnost (kg)',
  'csv.smm': 'SMM (kg)',
  'csv.pbf': 'PBF (%)',
  'csv.bmi': 'BMI',
  'csv.inbodyScore': 'InBody skóre',
  'csv.sourceFile': 'Zdrojový soubor',

  // Confirm modals
  'confirm.delete': 'Smazat',
  'confirm.confirm': 'Potvrdit',
  'confirm.cancel': 'Zrušit',
  'confirm.clearTitle': 'Smazat všechna data',
  'confirm.clearMessage': 'Smazat všechna měření a cíle? Tuto akci nelze vrátit.',
  'confirm.deleteScanTitle': 'Smazat měření',
  'confirm.deleteScanMessage': 'Smazat měření z {date}? Tuto akci nelze vrátit.',

  // Scan detail
  'detail.id': 'ID: {value}',
  'detail.age': 'Věk {value}',
  'detail.save': 'Uložit',
  'detail.edit': 'Upravit',
  'detail.delete': 'Smazat',
  'detail.inbodyScore': 'InBody skóre',

  // Sections
  'section.bodyComposition': 'Složení těla',
  'section.muscleFat': 'Analýza svalů a tuku',
  'section.obesity': 'Analýza obezity',
  'section.weightControl': 'Kontrola hmotnosti',
  'section.research': 'Výzkumné parametry',

  // Field labels
  'field.totalBodyWater': 'Celková tělesná voda',
  'field.protein': 'Bílkoviny',
  'field.minerals': 'Minerály',
  'field.bodyFatMass': 'Tělesný tuk',
  'field.weight': 'Hmotnost',
  'field.smm': 'Kosterní svalstvo',
  'field.bmi': 'BMI',
  'field.pbf': 'Procento tělesného tuku',
  'field.targetWeight': 'Cílová hmotnost',
  'field.weightControl': 'Kontrola hmotnosti',
  'field.fatControl': 'Kontrola tuku',
  'field.muscleControl': 'Kontrola svalů',
  'field.waistHipRatio': 'Poměr pas-boky',
  'field.visceralFatLevel': 'Úroveň viscerálního tuku',
  'field.fatFreeMass': 'Beztuková hmota',
  'field.basalMetabolicRate': 'Bazální metabolismus',
  'field.obesityDegree': 'Stupeň obezity',
  'field.smi': 'SMI',
  'field.recommendedCalories': 'Doporučený kalorický příjem',

  // Segmental
  'segment.rightArm': 'Pravá paže',
  'segment.leftArm': 'Levá paže',
  'segment.trunk': 'Trup',
  'segment.rightLeg': 'Pravá noha',
  'segment.leftLeg': 'Levá noha',
  'segment.leanTitle': 'Segmentální analýza svalů',
  'segment.fatTitle': 'Segmentální analýza tuku',
  'segment.impedance': 'Impedance',
  'segment.frequency': 'Frekvence',

  // Composition bar
  'comp.water': 'Voda',
  'comp.protein': 'Bílkoviny',
  'comp.minerals': 'Minerály',
  'comp.fat': 'Tuk',
  'comp.breakdown': 'Rozložení složení těla',

  // Charts
  'chart.weightMuscle': 'Hmotnost a svaly',
  'chart.weightKg': 'Hmotnost (kg)',
  'chart.smmKg': 'SMM (kg)',
  'chart.fatMassKg': 'Tuková hmota (kg)',
  'chart.fatBmi': 'Tělesný tuk % a BMI',
  'chart.pbfPercent': 'PBF (%)',
  'chart.bmi': 'BMI',
  'chart.goal': 'Cíl',
  'chart.needMore': 'Pro zobrazení trendů jsou potřeba alespoň 2 měření',

  // Glossary
  'glossary.SMM': 'Kosterní svalstvo - celková hmotnost svalů připojených ke kostem',
  'glossary.BMI': 'Index tělesné hmotnosti - hmotnost (kg) dělená výškou na druhou (m²)',
  'glossary.PBF': 'Procento tělesného tuku - tělesný tuk jako procento celkové hmotnosti',
  'glossary.BFM': 'Tělesný tuk - celková hmotnost tukové tkáně v těle',
  'glossary.FFM': 'Beztuková hmota - celková hmotnost mínus tělesný tuk',
  'glossary.TBW': 'Celková tělesná voda - celkové množství vody v těle',
  'glossary.SMI': 'Index kosterního svalstva - kosterní svalstvo dělené výškou na druhou',
  'glossary.BMR': 'Bazální metabolismus - kalorie spálené v klidu za den',
  'glossary.WHR': 'Poměr pas-boky - obvod pasu dělený obvodem boků',
  'glossary.VFL': 'Úroveň viscerálního tuku - odhadovaný tuk kolem vnitřních orgánů (stupnice 1-20)',
  'glossary.InBody': 'InBody skóre - celkové skóre složení těla (0-100)',
};
