import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aems_db',
});

// 30 questions for CODEX HACCP
const haccpQuestions = [
  {
    q: "How many preliminary steps and how many principles form the Codex Alimentarius HACCP system?",
    opts: ["5 Preliminary Steps and 7 Principles", "7 Preliminary Steps and 5 Principles", "4 Preliminary Steps and 8 Principles", "6 Preliminary Steps and 6 Principles"],
    ans: "5 Preliminary Steps and 7 Principles",
    exp: "Codex Alimentarius HACCP consists of 5 preliminary steps (assemble team, describe product, identify intended use, construct flow diagram, confirm flow diagram) followed by the 7 HACCP principles.",
    diff: "Easy"
  },
  {
    q: "What is Principle 1 of the HACCP system?",
    opts: ["Conduct a Hazard Analysis", "Determine Critical Control Points", "Establish Critical Limits", "Establish Monitoring Procedures"],
    ans: "Conduct a Hazard Analysis",
    exp: "Principle 1 requires identifying potential biological, chemical, or physical hazards associated with all stages of food production.",
    diff: "Easy"
  },
  {
    q: "A Critical Control Point (CCP) is defined as:",
    opts: ["A step at which control can be applied and is essential to prevent or eliminate a food safety hazard or reduce it to an acceptable level", "Any point where a biological hazard might potentially be introduced", "A general sanitation standard operating procedure", "A point where a quality audit must be performed by external bodies"],
    ans: "A step at which control can be applied and is essential to prevent or eliminate a food safety hazard or reduce it to an acceptable level",
    exp: "Codex defines a CCP specifically as a step where control is essential to prevent, eliminate, or reduce a safety hazard to an acceptable level.",
    diff: "Medium"
  },
  {
    q: "Which tool is commonly used to systematically determine whether a process step is a CCP?",
    opts: ["Codex CCP Decision Tree", "Ishikawa Fishbone Diagram", "Gantt Milestone Chart", "Six Sigma DMAIC Matrix"],
    ans: "Codex CCP Decision Tree",
    exp: "The Codex Decision Tree utilizes a sequence of 4 questions to systematically establish whether a processing step is a CCP.",
    diff: "Easy"
  },
  {
    q: "What is the purpose of establishing 'Critical Limits' in HACCP Principle 3?",
    opts: ["To distinguish between acceptable and unacceptable safe operating boundaries at a CCP", "To decide how much financial budget can be allocated for sanitation", "To determine maximum daily factory throughput", "To establish employee break schedules"],
    ans: "To distinguish between acceptable and unacceptable safe operating boundaries at a CCP",
    exp: "Critical limits are measurable criteria (such as temperature, time, pH, moisture, chlorine level) separating acceptability from unacceptability.",
    diff: "Medium"
  },
  {
    q: "Which of the following is an example of a physical food safety hazard?",
    opts: ["Metal fragments from broken machinery", "Salmonella enterica bacteria", "Pesticide chemical residue", "Patulin mycotoxin in apple juice"],
    ans: "Metal fragments from broken machinery",
    exp: "Metal fragments, glass splinters, hard plastic, and bone pieces represent physical hazards in food safety.",
    diff: "Easy"
  },
  {
    q: "When a critical limit at a CCP is breached, what must immediately occur according to HACCP Principle 5?",
    opts: ["Predetermined Corrective Actions must be executed", "The factory must cease operations for 30 days", "All staff members must be re-interviewed", "The entire HACCP plan must be discarded"],
    ans: "Predetermined Corrective Actions must be executed",
    exp: "Principle 5 specifies that specific corrective actions must be developed for each CCP to deal with deviations when they occur.",
    diff: "Easy"
  },
  {
    q: "Which activity represents 'Verification' under HACCP Principle 6 rather than simple monitoring?",
    opts: ["Annual calibration of temperature probes and independent microbial testing", "A cook reading a meat thermometer every 15 minutes", "A packaging operator checking seal integrity on every bag", "Checking delivery truck door lock on arrival"],
    ans: "Annual calibration of temperature probes and independent microbial testing",
    exp: "Verification involves application of methods, procedures, tests, and other evaluations to determine compliance with the HACCP plan.",
    diff: "Hard"
  },
  {
    q: "What is the first preliminary step before applying the 7 HACCP principles?",
    opts: ["Assemble the multidisciplinary HACCP Team", "Construct the Flow Diagram", "Identify intended end-users", "Describe the product composition"],
    ans: "Assemble the multidisciplinary HACCP Team",
    exp: "Preliminary Step 1 requires assembling a multidisciplinary team with specific knowledge and expertise appropriate to the product.",
    diff: "Easy"
  },
  {
    q: "Biological hazards in food processing primarily encompass:",
    opts: ["Pathogenic bacteria, viruses, parasites, and mold spores", "Heavy metals like lead and cadmium", "Cleaning detergents and sanitizers", "Extraneous foreign stones and wood splinters"],
    ans: "Pathogenic bacteria, viruses, parasites, and mold spores",
    exp: "Biological hazards consist of pathogenic microorganisms including bacteria, viruses, fungi, and parasites.",
    diff: "Easy"
  },
  {
    q: "Which of the following is considered a prerequisite program (PRP) rather than a CCP?",
    opts: ["Pest control program and facility sanitization SOPs", "Metal detector rejection gate in packaged meat", "Thermal pasteurization step at 72°C for 15 seconds", "Acidification step to pH 4.2 in canned pickles"],
    ans: "Pest control program and facility sanitization SOPs",
    exp: "General facility maintenance, pest control, and sanitation are PRPs (Good Hygiene Practices) that provide the foundation for HACCP.",
    diff: "Medium"
  },
  {
    q: "In HACCP documentation, how long should monitoring and verification records typically be retained?",
    opts: ["For the shelf-life of the product plus an additional regulatory retention period", "Until the shift supervisor leaves for the day", "Exactly 30 calendar days", "Only until the product leaves the factory loading dock"],
    ans: "For the shelf-life of the product plus an additional regulatory retention period",
    exp: "Codex and global regulators require retaining HACCP records beyond the stated product shelf-life to support potential traceback.",
    diff: "Medium"
  },
  {
    q: "A cook-chill food product requires cooking to an internal core temperature of 75°C for 2 minutes. This parameter represents:",
    opts: ["A Critical Limit", "A Prerequisite Suggestion", "A Customer Preference", "A Biological Hazard"],
    ans: "A Critical Limit",
    exp: "75°C core temperature for 2 minutes is the specific measurable threshold that eliminates vegetative pathogens at the cooking CCP.",
    diff: "Medium"
  },
  {
    q: "Which bacterium is capable of producing heat-stable enterotoxins in room-temperature cooked foods?",
    opts: ["Staphylococcus aureus", "Campylobacter jejuni", "Vibrio vulnificus", "Listeria monocytogenes"],
    ans: "Staphylococcus aureus",
    exp: "Staphylococcus aureus produces pre-formed enterotoxins that are heat-stable and resist boiling.",
    diff: "Hard"
  },
  {
    q: "What is the primary role of a HACCP Flow Diagram (Preliminary Step 4 & 5)?",
    opts: ["To provide a complete chronological sequence of all processing steps from raw material intake to consumer dispatch", "To map the electrical wiring in the food manufacturing plant", "To display corporate organization hierarchy", "To track quarterly financial sales performance"],
    ans: "To provide a complete chronological sequence of all processing steps from raw material intake to consumer dispatch",
    exp: "The flow diagram details all operational steps to assist the HACCP team in identifying where hazards may be introduced or amplified.",
    diff: "Medium"
  },
  {
    q: "Who is responsible for confirming the accuracy of the process flow diagram under Preliminary Step 5?",
    opts: ["The HACCP Team by conducting an on-site, in-person walk-through during all operational stages", "The external certification auditor during the closing meeting", "The equipment manufacturer sales representative", "The local public health inspector via email review"],
    ans: "The HACCP Team by conducting an on-site, in-person walk-through during all operational stages",
    exp: "Step 5 specifically requires an on-site confirmation of the flow diagram during operation across all shifts.",
    diff: "Medium"
  },
  {
    q: "Which of the following describes an Operational Prerequisite Program (oPRP)?",
    opts: ["A control measure identified by hazard analysis as essential to prevent or reduce significant hazards, managed without critical limits", "A routine daily sweeping of the office administrative lobby", "A post-production advertising campaign review", "An annual staff salary appraisal system"],
    ans: "A control measure identified by hazard analysis as essential to prevent or reduce significant hazards, managed without critical limits",
    exp: "An oPRP controls a significant food safety hazard where measurable quantitative critical limits are not necessarily feasible.",
    diff: "Hard"
  },
  {
    q: "Which of the following is NOT one of the 7 HACCP Principles?",
    opts: ["Establishing product retail sales pricing tiers", "Conducting a hazard analysis", "Determining critical control points", "Establishing recordkeeping procedures"],
    ans: "Establishing product retail sales pricing tiers",
    exp: "Commercial pricing is a business function completely unrelated to food safety principles.",
    diff: "Easy"
  },
  {
    q: "What should happen to product manufactured during a period where a CCP was found to be out of control?",
    opts: ["The product must be placed on quarantine hold for evaluation and risk assessment before release or disposal", "The product should be immediately sold at a discounted clearance price", "The product must be shipped immediately to prevent inventory backlog", "The product should be mixed with good product to dilute the hazard"],
    ans: "The product must be placed on quarantine hold for evaluation and risk assessment before release or disposal",
    exp: "Corrective actions require that affected non-conforming product is quarantined and evaluated for food safety risk.",
    diff: "Medium"
  },
  {
    q: "Cross-contamination in a food processing plant is best prevented by:",
    opts: ["Strict physical zoning separating raw handling from cooked/ready-to-eat areas", "Increasing room lighting in storage areas", "Using single-speed conveyor belts", "Purchasing raw materials from local suppliers only"],
    ans: "Strict physical zoning separating raw handling from cooked/ready-to-eat areas",
    exp: "Physical zoning, dedicated utensils, and controlled personnel airflow prevent transferring raw pathogens into post-lethality areas.",
    diff: "Easy"
  },
  {
    q: "Which pathogen is psychrotrophic, meaning it can multiply at standard refrigeration temperatures (2°C - 4°C)?",
    opts: ["Listeria monocytogenes", "Escherichia coli O157:H7", "Clostridium perfringens", "Salmonella typhimurium"],
    ans: "Listeria monocytogenes",
    exp: "Listeria monocytogenes is psychrotrophic and capable of slow growth at refrigeration temperatures, making it a critical environmental hazard.",
    diff: "Hard"
  },
  {
    q: "What is the primary objective of validating a HACCP plan?",
    opts: ["To obtain objective scientific evidence that the plan will effectively control the identified food safety hazards before implementation", "To verify that all invoices have been signed by accounting", "To ensure packaging artwork matches company brand guidelines", "To check employee attendance rates during morning shifts"],
    ans: "To obtain objective scientific evidence that the plan will effectively control the identified food safety hazards before implementation",
    exp: "Validation confirms scientifically that the chosen control measures and critical limits are capable of achieving their safety targets.",
    diff: "Hard"
  },
  {
    q: "Which method is the most reliable continuous monitoring technique for a liquid pasteurization CCP?",
    opts: ["Automated recording thermometer with diversion valve activation", "Manual glass mercury thermometer check once per hour", "Visual inspection of milk steam bubbles", "Operator tasting sample from the cooling vat"],
    ans: "Automated recording thermometer with diversion valve activation",
    exp: "Continuous automated monitoring with automatic diversion prevents under-pasteurized product from proceeding downstream.",
    diff: "Medium"
  },
  {
    q: "When must an established HACCP plan undergo formal review and revalidation?",
    opts: ["Whenever there are changes in ingredients, formulation, processing steps, or equipment", "Only when an outbreak of food poisoning has been reported in the news", "Never, once approved by the management", "Strictly every 10 years"],
    ans: "Whenever there are changes in ingredients, formulation, processing steps, or equipment",
    exp: "Any modification to raw materials, equipment, process flow, or emerging hazard data triggers an immediate HACCP review.",
    diff: "Medium"
  },
  {
    q: "An allergen management plan within HACCP addresses:",
    opts: ["Cross-contact prevention and accurate regulatory ingredient labeling", "Controlling bacterial spores in canned goods", "Calibrating metal detector sensitivity blocks", "Chlorine contact time in flume water"],
    ans: "Cross-contact prevention and accurate regulatory ingredient labeling",
    exp: "Allergens are chemical hazards controlled through dedicated scheduling, cleaning verification, and exact label declarations.",
    diff: "Easy"
  },
  {
    q: "Which of the following is considered an anaerobic, spore-forming foodborne pathogen of high concern in low-acid canned foods?",
    opts: ["Clostridium botulinum", "Campylobacter jejuni", "Shigella sonnei", "Norovirus"],
    ans: "Clostridium botulinum",
    exp: "Clostridium botulinum produces deadly neurotoxins under anaerobic conditions in low-acid foods (pH > 4.6).",
    diff: "Hard"
  },
  {
    q: "HACCP Principle 7 focuses on:",
    opts: ["Establishing documentation and recordkeeping procedures", "Formulating emergency evacuation plans", "Marketing certified products on social media", "Auditing vendor credit scores"],
    ans: "Establishing documentation and recordkeeping procedures",
    exp: "Principle 7 mandates comprehensive documentation covering the hazard analysis, CCP determination, critical limits, monitoring, and corrective actions.",
    diff: "Easy"
  },
  {
    q: "What is 'water activity' (aw) and why is it monitored in food safety?",
    opts: ["A measure of unbound, free water available for microbial proliferation", "The total volume of tap water used to wash vegetable raw materials", "The hydrostatic pressure of steam in a retort cooker", "The percentage of water added to reduce ingredient costs"],
    ans: "A measure of unbound, free water available for microbial proliferation",
    exp: "Water activity indicates the unbound water that microorganisms can utilize; most pathogenic bacteria cannot grow below aw 0.85.",
    diff: "Medium"
  },
  {
    q: "Which of the following illustrates a physical verification method for a metal detector CCP?",
    opts: ["Passing ferrous, non-ferrous, and stainless steel test wands through the detector at regular intervals", "Wiping down the conveyor belt with quaternary ammonium compound", "Measuring the ambient humidity in the packing room", "Checking the expiration date of the packaging film"],
    ans: "Passing ferrous, non-ferrous, and stainless steel test wands through the detector at regular intervals",
    exp: "Standard test wands containing certified metal spherical specimens ensure the detector is operating with required sensitivity.",
    diff: "Medium"
  },
  {
    q: "What is the primary difference between a CCP and a Prerequisite Program (PRP)?",
    opts: ["A CCP is step-specific and essential to control a specific hazard, while PRPs maintain general baseline hygiene conditions across the facility", "A CCP only applies to meat, while PRPs only apply to bakeries", "A CCP does not require records, whereas PRPs require hourly logs", "PRPs replace the need for critical limits at CCPs"],
    ans: "A CCP is step-specific and essential to control a specific hazard, while PRPs maintain general baseline hygiene conditions across the facility",
    exp: "PRPs deal with general environmental and operational conditions, whereas CCPs specifically control identified hazards at distinct process points.",
    diff: "Hard"
  }
];

// 30 questions for Food Safety
const foodSafetyQuestions = [
  {
    q: "What is the recognized temperature 'Danger Zone' where bacteria multiply most rapidly?",
    opts: ["5°C to 60°C (41°F to 140°F)", "0°C to 10°C (32°F to 50°F)", "65°C to 100°C (149°F to 212°F)", "-18°C to 0°C (0°F to 32°F)"],
    ans: "5°C to 60°C (41°F to 140°F)",
    exp: "Between 5°C and 60°C, bacteria can double in population every 15-20 minutes under favorable conditions.",
    diff: "Easy"
  },
  {
    q: "What is the minimum recommended duration for washing hands with soap and warm water in food handling?",
    opts: ["20 seconds", "5 seconds", "45 seconds", "2 minutes"],
    ans: "20 seconds",
    exp: "Health authorities internationally mandate at least 20 seconds of thorough scrubbing with soap and warm running water.",
    diff: "Easy"
  },
  {
    q: "Which of the following is considered one of the 'Big 8' / top global food allergens?",
    opts: ["Crustaceans (shellfish)", "White cane sugar", "Black pepper", "Olive oil"],
    ans: "Crustaceans (shellfish)",
    exp: "Crustaceans, fish, peanuts, tree nuts, milk, eggs, wheat, and soybeans comprise the primary major allergens.",
    diff: "Easy"
  },
  {
    q: "What is the recommended safe internal temperature for thoroughly cooked poultry (chicken, turkey)?",
    opts: ["74°C (165°F) for at least 15 seconds", "55°C (131°F)", "60°C (140°F)", "95°C (203°F)"],
    ans: "74°C (165°F) for at least 15 seconds",
    exp: "Poultry must reach at least 74°C (165°F) core temperature to ensure destruction of Salmonella and Campylobacter.",
    diff: "Easy"
  },
  {
    q: "How should frozen raw meat and poultry be safely thawed?",
    opts: ["Inside a refrigerator at 4°C or below, or under cold running potable water", "Left out on the kitchen counter at room temperature overnight", "Under direct sunlight on an open preparation counter", "Soaked in hot standing water for 6 hours"],
    ans: "Inside a refrigerator at 4°C or below, or under cold running potable water",
    exp: "Thawing at room temperature allows the outer surface to enter the Danger Zone while the interior remains frozen.",
    diff: "Easy"
  },
  {
    q: "Which board color is internationally standard in color-coded food prep for raw poultry?",
    opts: ["Yellow", "Red", "Green", "Blue"],
    ans: "Yellow",
    exp: "In commercial kitchens, yellow is standard for poultry, red for raw meat, blue for seafood, and green for vegetables.",
    diff: "Medium"
  },
  {
    q: "Food workers suffering from symptoms of vomiting or acute diarrhea must:",
    opts: ["Be excluded from food handling for at least 48 hours after symptoms cease", "Wear two pairs of gloves and continue preparing hot soups", "Work only in the salad and cold dish station", "Take an antacid and resume work immediately"],
    ans: "Be excluded from food handling for at least 48 hours after symptoms cease",
    exp: "Gastroenteritis symptoms indicate potential Norovirus or Salmonella shedding; 48 hours symptom-free exclusion is mandatory.",
    diff: "Easy"
  },
  {
    q: "What does the food safety acronym 'FIFO' stand for in inventory management?",
    opts: ["First In, First Out", "Fast Inspection, Fast Output", "Food Ingredients First Ordered", "Frequent Intake, Frequent Optimization"],
    ans: "First In, First Out",
    exp: "First In, First Out ensures older stock is utilized before newer deliveries to prevent spoilage and quality deterioration.",
    diff: "Easy"
  },
  {
    q: "Chemical sanitizers (like sodium hypochlorite) are most effective when applied to:",
    opts: ["Surfaces that have already been washed with detergent and rinsed clean", "Greasy surfaces covered in food crumbs to dissolve dirt", "Hot food pans fresh out of the oven", "Food ingredients directly before consumption"],
    ans: "Surfaces that have already been washed with detergent and rinsed clean",
    exp: "Organic material and grease neutralize chemical sanitizers; cleaning must precede sanitization.",
    diff: "Medium"
  },
  {
    q: "Which pathogen is the leading cause of non-bacterial acute gastroenteritis food poisoning worldwide?",
    opts: ["Norovirus", "Rotavirus", "Hepatitis A", "Adenovirus"],
    ans: "Norovirus",
    exp: "Norovirus is highly contagious and the primary viral agent responsible for foodborne gastrointestinal outbreaks.",
    diff: "Medium"
  },
  {
    q: "At what temperature must commercial chilled storage units operate?",
    opts: ["At or below 4°C (39°F)", "Between 8°C and 12°C", "Between 15°C and 20°C", "Below -18°C"],
    ans: "At or below 4°C (39°F)",
    exp: "Maintaining cold holding at or below 4°C retards microbial proliferation and extends shelf life safely.",
    diff: "Easy"
  },
  {
    q: "What is cross-contact in food safety?",
    opts: ["The unintentional transfer of an allergenic protein from one food to another", "The transfer of bacteria between raw chicken and salad", "When two cutting boards touch on a drying rack", "When kitchen staff shake hands during shift handover"],
    ans: "The unintentional transfer of an allergenic protein from one food to another",
    exp: "Cross-contact specifically refers to the accidental transfer of allergens, which cannot be destroyed by cooking.",
    diff: "Medium"
  },
  {
    q: "Which type of thermometer is best suited for measuring the internal temperature of thin burger patties?",
    opts: ["A thermocouple or thermistor with a thin tip needle probe", "A non-contact infrared surface laser thermometer", "A traditional glass mercury candy thermometer", "A mechanical bimetallic dial thermometer inserted 2 inches"],
    ans: "A thermocouple or thermistor with a thin tip needle probe",
    exp: "Thermocouple probes sense temperature at the very tip, making them accurate for thin meats unlike bimetallic dials.",
    diff: "Hard"
  },
  {
    q: "Why must raw meat never be stored directly above ready-to-eat foods in a refrigerator?",
    opts: ["Raw meat juices could drip down and cross-contaminate ready-to-eat food", "Raw meat absorbs odors from ready-to-eat vegetables", "The top shelf is always the warmest area of the refrigerator", "It prevents raw meat from defrosting too quickly"],
    ans: "Raw meat juices could drip down and cross-contaminate ready-to-eat food",
    exp: "Gravity can cause bloody exudate and pathogens like Salmonella from raw meat to drip onto foods eaten without cooking.",
    diff: "Easy"
  },
  {
    q: "Hot-held food (e.g., in a buffet Bain-Marie) must be maintained at a minimum temperature of:",
    opts: ["60°C (140°F) or above", "45°C (113°F)", "50°C (122°F)", "75°C (167°F)"],
    ans: "60°C (140°F) or above",
    exp: "Maintaining hot food at or above 60°C keeps it above the Danger Zone and prevents spore germination.",
    diff: "Easy"
  },
  {
    q: "What is the maximum time hot food can remain in the cooling stage from 60°C to 20°C under the two-stage cooling rule?",
    opts: ["2 hours", "4 hours", "6 hours", "30 minutes"],
    ans: "2 hours",
    exp: "The two-stage cooling process requires cooling from 60°C to 20°C within 2 hours, and from 20°C to 5°C within an additional 4 hours.",
    diff: "Hard"
  },
  {
    q: "Potable water is defined as water that is:",
    opts: ["Safe and wholesome for human drinking and food preparation meeting microbiological standards", "Water that contains less than 10% dissolved minerals", "Recycled wastewater treated with UV light only", "Water obtained directly from a natural mountain stream"],
    ans: "Safe and wholesome for human drinking and food preparation meeting microbiological standards",
    exp: "Potable water must be free from harmful biological pathogens and toxic chemical concentrations.",
    diff: "Easy"
  },
  {
    q: "An Integrated Pest Management (IPM) program relies primarily on:",
    opts: ["Facility exclusion, harborage elimination, sanitation, and physical pest barriers", "Spraying chemical insecticide spray across open food counters daily", "Leaving bait poison pellets open on kitchen food preparation tables", "Allowing domestic cats to roam inside warehouse storage aisles"],
    ans: "Facility exclusion, harborage elimination, sanitation, and physical pest barriers",
    exp: "IPM emphasizes preventing pest entry and denying food/shelter rather than indiscriminate chemical pesticide use.",
    diff: "Medium"
  },
  {
    q: "Which toxin can form in temperature-abused scombroid fish (tuna, mackerel) that is not eliminated by cooking?",
    opts: ["Histamine", "Ciguatoxin", "Saxitoxin", "Tetrodotoxin"],
    ans: "Histamine",
    exp: "Histidine converts to histamine when scombroid fish are improperly chilled; histamine is heat-stable and survives cooking.",
    diff: "Hard"
  },
  {
    q: "Food contact surfaces should be cleaned and sanitized at least once every:",
    opts: ["4 hours during continuous active use", "24 hours at the end of each day", "7 days during weekly maintenance", "1 hour regardless of whether they were used"],
    ans: "4 hours during continuous active use",
    exp: "Standard regulations require cleaning and sanitizing food contact surfaces every 4 hours to prevent pathogen buildup.",
    diff: "Medium"
  },
  {
    q: "When receiving a delivery of fresh refrigerated milk, the delivery must be rejected if the temperature is:",
    opts: ["Above 7°C (45°F)", "Below 4°C (39°F)", "Exactly 3°C (37°F)", "Between 1°C and 4°C"],
    ans: "Above 7°C (45°F)",
    exp: "Fresh dairy shipments received above acceptable cold temperatures indicate transport abuse and must be rejected.",
    diff: "Medium"
  },
  {
    q: "A high-risk food is characterized by which of the following properties?",
    opts: ["High moisture content, high protein, and neutral to slightly acidic pH", "High sugar content with a dry brittle texture", "Very low moisture (dry) with high acidity (pH < 3.0)", "High salt concentration and zero water activity"],
    ans: "High moisture content, high protein, and neutral to slightly acidic pH",
    exp: "Foods rich in moisture and protein (dairy, cooked meats, poultry, seafood) support rapid pathogen multiplication.",
    diff: "Medium"
  },
  {
    q: "What is the proper method for tasting food being prepared during commercial culinary production?",
    opts: ["Ladle a small sample into a separate tasting bowl and taste with a dedicated single-use clean spoon", "Dip the chef tasting spoon directly into the stockpot repeatedly", "Taste with finger dipped directly into the simmer pot", "Taste directly from the main cooking ladle"],
    ans: "Ladle a small sample into a separate tasting bowl and taste with a dedicated single-use clean spoon",
    exp: "Never double-dip or use fingers; a separate tasting bowl and clean utensil prevent introducing salivary bacteria.",
    diff: "Easy"
  },
  {
    q: "Which organism is commonly associated with improperly sanitized slicers, cold cuts, and soft cheeses?",
    opts: ["Listeria monocytogenes", "Trichinella spiralis", "Cryptosporidium parvum", "Giardia lamblia"],
    ans: "Listeria monocytogenes",
    exp: "Listeria forms resilient biofilms in cold, damp machinery niches like commercial deli slicers.",
    diff: "Medium"
  },
  {
    q: "What is the primary function of an air curtain over a food facility loading dock doorway?",
    opts: ["To prevent airborne flying insects and dust from entering the facility", "To cool the incoming pallets of raw produce", "To dry the wet floors inside the warehouse", "To blow food aromas out toward incoming delivery drivers"],
    ans: "To prevent airborne flying insects and dust from entering the facility",
    exp: "High-velocity air curtains create an invisible physical air barrier stopping flies and flying pests.",
    diff: "Medium"
  },
  {
    q: "How should bulk dry food ingredients (flour, rice, beans) be stored in a dry storeroom?",
    opts: ["At least 15 cm (6 inches) off the floor and away from exterior walls", "Directly on the floor in open paper bags", "Stacked directly against damp exterior concrete walls", "Underneath exposed water and sewer plumbing pipes"],
    ans: "At least 15 cm (6 inches) off the floor and away from exterior walls",
    exp: "Storing dry goods 15 cm (6 inches) off the floor facilitates sanitation, pest inspection, and air circulation.",
    diff: "Easy"
  },
  {
    q: "Which type of bandage must a food handler wear on an open cut on their hand?",
    opts: ["A bright brightly colored (usually blue) waterproof bandage covered by a clean single-use disposable glove", "A flesh-colored fabric band-aid without any glove", "A clear transparent adhesive strip", "A loose sterile cotton gauze roll"],
    ans: "A bright brightly colored (usually blue) waterproof bandage covered by a clean single-use disposable glove",
    exp: "Blue is not naturally found in foods (making it readily visible if dropped), and gloves prevent bandage slippage.",
    diff: "Easy"
  },
  {
    q: "What is the critical control limit for chlorine bleach concentration in a standard three-compartment sink sanitizing step?",
    opts: ["50 to 100 parts per million (ppm)", "1 to 5 parts per million (ppm)", "500 to 1000 parts per million (ppm)", "Over 2000 parts per million (ppm)"],
    ans: "50 to 100 parts per million (ppm)",
    exp: "50-100 ppm of available free chlorine provides effective sanitization without leaving toxic residues or strong odors.",
    diff: "Hard"
  },
  {
    q: "Which chemical contaminant can leach into high-acid foods (tomato sauce, citrus juice) from improper metal cookware?",
    opts: ["Copper or Zinc from galvanized metals", "Sodium bicarbonate", "Calcium phosphate", "Potassium sorbate"],
    ans: "Copper or Zinc from galvanized metals",
    exp: "High acids dissolve toxic metals from copper, zinc, and lead alloys; stainless steel or food-grade coatings are required.",
    diff: "Hard"
  },
  {
    q: "What is a 'Recall' in food industry quality assurance?",
    opts: ["A coordinated action to remove food from the distribution supply chain and consumers due to potential safety risks", "A customer returning an overcooked steak in a restaurant", "A supplier sending the wrong flavor of fruit juice", "A routine price adjustment on supermarket shelves"],
    ans: "A coordinated action to remove food from the distribution supply chain and consumers due to potential safety risks",
    exp: "A recall removes adulterated or mislabeled food to protect public health and prevent outbreaks.",
    diff: "Easy"
  }
];

async function seedQuestionBank() {
  const connection = await pool.getConnection();
  try {
    console.log('Seeding Question Bank for Certification Exams...');
    await connection.beginTransaction();

    // 1. Seed CODEX HACCP Questions
    const haccpExamId = 'exam-codex-haccp';
    console.log(`Adding ${haccpQuestions.length} questions to ${haccpExamId}...`);
    for (let i = 0; i < haccpQuestions.length; i++) {
      const q = haccpQuestions[i];
      const qId = uuidv4();
      await connection.query(`
        INSERT INTO public_exam_questions (id, exam_id, question_text, type, options_json, correct_answer, explanation, marks, order_index, difficulty_level)
        VALUES (?, ?, ?, 'mcq', ?, ?, ?, 1, ?, ?)
      `, [qId, haccpExamId, q.q, JSON.stringify(q.opts), q.ans, q.exp, i + 1, q.diff]);
    }

    // 2. Seed Food Safety Questions
    const foodSafetyExamId = 'exam-food-safety';
    console.log(`Adding ${foodSafetyQuestions.length} questions to ${foodSafetyExamId}...`);
    for (let i = 0; i < foodSafetyQuestions.length; i++) {
      const q = foodSafetyQuestions[i];
      const qId = uuidv4();
      await connection.query(`
        INSERT INTO public_exam_questions (id, exam_id, question_text, type, options_json, correct_answer, explanation, marks, order_index, difficulty_level)
        VALUES (?, ?, ?, 'mcq', ?, ?, ?, 1, ?, ?)
      `, [qId, foodSafetyExamId, q.q, JSON.stringify(q.opts), q.ans, q.exp, i + 1, q.diff]);
    }

    // Update total_marks to match total_questions (10 questions = 10 marks, passing marks = 5)
    await connection.query('UPDATE public_exams SET total_questions = 10, total_marks = 10, passing_marks = 5 WHERE id IN (?, ?)', [haccpExamId, foodSafetyExamId]);

    await connection.commit();
    console.log('Successfully seeded Question Bank for CODEX HACCP and Food Safety!');
    console.log(`- CODEX HACCP now has ${haccpQuestions.length} questions (Pool meets 3× requirement: 30 / 10*3)`);
    console.log(`- Food Safety now has ${foodSafetyQuestions.length} questions (Pool meets 3× requirement: 30 / 10*3)`);

  } catch (error) {
    await connection.rollback();
    console.error('Error seeding questions:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedQuestionBank();
