package com.example.meridian.data.curriculum

data class StudyDayTopic(
    val id: String,
    val subjectCode: String,
    val subjectName: String,
    val moduleCode: String,
    val moduleTitle: String,
    val dayNum: Int,
    val title: String,
    val brief: String,
    val anki: String,
    val recallQuestions: List<String>,
    val targetMins: Int
)

data class CurriculumSubject(
    val code: String,
    val name: String,
    val colorHex: String,
    val tagline: String,
    val topics: List<StudyDayTopic>
)

object MedicalCurriculum {
    val subjects: List<CurriculumSubject> = listOf(
        CurriculumSubject(
            code = "ANA",
            name = "Anatomy",
            colorHex = "#2D6A4F",
            tagline = "Gross anatomy, embryology and histology — 200L Nigerian medical syllabus.",
            topics = listOf(
                StudyDayTopic(
                    id = "ana_201_1",
                    subjectCode = "ANA",
                    subjectName = "Anatomy",
                    moduleCode = "ANA 201",
                    moduleTitle = "General anatomy & lower limb",
                    dayNum = 1,
                    title = "Anatomical position, planes and terminology",
                    brief = "Standard positional and directional terms and the three cardinal planes.",
                    anki = "Cloze cards pairing each term with its opposite: proximal -> distal, medial -> lateral.",
                    recallQuestions = listOf(
                        "Define anatomical position and list 6 directional terms with their opposites.",
                        "What are the three cardinal planes and what do they each divide the body into?"
                    ),
                    targetMins = 40
                ),
                StudyDayTopic(
                    id = "ana_201_2",
                    subjectCode = "ANA",
                    subjectName = "Anatomy",
                    moduleCode = "ANA 201",
                    moduleTitle = "General anatomy & lower limb",
                    dayNum = 2,
                    title = "Classification of bones, joints and muscles",
                    brief = "Group bones by shape, joints by structure and movement, and muscles by fibre arrangement.",
                    anki = "Table card classifying each joint type with one worked example.",
                    recallQuestions = listOf(
                        "Classify the hip joint and the elbow joint by structure and movement type.",
                        "Name the six subtypes of synovial joint with one example of each."
                    ),
                    targetMins = 45
                ),
                StudyDayTopic(
                    id = "ana_201_3",
                    subjectCode = "ANA",
                    subjectName = "Anatomy",
                    moduleCode = "ANA 201",
                    moduleTitle = "General anatomy & lower limb",
                    dayNum = 3,
                    title = "Bones of the lower limb & landmarks",
                    brief = "Major landmarks on the hip bone, femur, tibia and fibula.",
                    anki = "Image-occlusion card of each bone, revealing one landmark at a time.",
                    recallQuestions = listOf(
                        "Name the three parts of the hip bone and where they fuse in the acetabulum.",
                        "List 4 palpable landmarks each on the femur and tibia."
                    ),
                    targetMins = 55
                ),
                StudyDayTopic(
                    id = "ana_201_4",
                    subjectCode = "ANA",
                    subjectName = "Anatomy",
                    moduleCode = "ANA 201",
                    moduleTitle = "General anatomy & lower limb",
                    dayNum = 4,
                    title = "Femoral triangle and sciatic nerve",
                    brief = "Map the gluteal muscles, the femoral triangle, and course of femoral and sciatic nerves.",
                    anki = "Cloze card for the femoral triangle boundaries and contents (NAVEL mnemonic).",
                    recallQuestions = listOf(
                        "What are the boundaries and contents of the femoral triangle?",
                        "Trace the sciatic nerve course and where it divides into tibial and common fibular nerves."
                    ),
                    targetMins = 50
                )
            )
        ),
        CurriculumSubject(
            code = "PHS",
            name = "Physiology",
            colorHex = "#00796B",
            tagline = "General principles, blood and cardiovascular physiology.",
            topics = listOf(
                StudyDayTopic(
                    id = "phs_201_1",
                    subjectCode = "PHS",
                    subjectName = "Physiology",
                    moduleCode = "PHS 201",
                    moduleTitle = "Blood and body fluids",
                    dayNum = 1,
                    title = "Body fluid compartments & homeostasis",
                    brief = "Total body water distribution, intracellular vs extracellular fluid, Starling forces.",
                    anki = "Calculation card: TBW (60%), ICF (40%), ECF (20% - interstitial 15%, plasma 5%).",
                    recallQuestions = listOf(
                        "Calculate the fluid volume compartments for a 70 kg adult.",
                        "Explain Starling forces across the capillary wall and causes of edema."
                    ),
                    targetMins = 45
                ),
                StudyDayTopic(
                    id = "phs_201_2",
                    subjectCode = "PHS",
                    subjectName = "Physiology",
                    moduleCode = "PHS 201",
                    moduleTitle = "Blood and body fluids",
                    dayNum = 2,
                    title = "Erythropoiesis & hemoglobin synthesis",
                    brief = "RBC lifecycle, erythropoietin trigger, iron metabolism and hemoglobin structure.",
                    anki = "Flowchart cloze card for erythropoiesis stages from CFU-E to reticulocyte.",
                    recallQuestions = listOf(
                        "Outline the regulation of erythropoietin release under hypoxia.",
                        "Explain the oxygen-hemoglobin dissociation curve and the Bohr effect."
                    ),
                    targetMins = 50
                ),
                StudyDayTopic(
                    id = "phs_202_1",
                    subjectCode = "PHS",
                    subjectName = "Physiology",
                    moduleCode = "PHS 202",
                    moduleTitle = "Cardiovascular system",
                    dayNum = 3,
                    title = "Cardiac action potential & conduction",
                    brief = "Pacemaker vs ventricular action potentials, ion channels, ECG correlation.",
                    anki = "Diagram card matching ECG waves (P, QRS, T) to cardiac electrical events.",
                    recallQuestions = listOf(
                        "Compare phase 0-4 of ventricular myocytes with SA node prepotential.",
                        "What does each deflection on a standard Lead II ECG represent?"
                    ),
                    targetMins = 60
                )
            )
        ),
        CurriculumSubject(
            code = "BCH",
            name = "Biochemistry",
            colorHex = "#D97706",
            tagline = "Chemistry of biomolecules, enzymes, and intermediary metabolism.",
            topics = listOf(
                StudyDayTopic(
                    id = "bch_201_1",
                    subjectCode = "BCH",
                    subjectName = "Biochemistry",
                    moduleCode = "BCH 201",
                    moduleTitle = "Chemistry of biomolecules & enzymes",
                    dayNum = 1,
                    title = "Amino acids & protein structure hierarchy",
                    brief = "Primary, secondary, tertiary, and quaternary protein architectures, bonds involved.",
                    anki = "Classification cloze of the 20 standard amino acids by R-group polarity and charge.",
                    recallQuestions = listOf(
                        "List the non-covalent forces that stabilize tertiary protein structures.",
                        "Explain how peptide bond planar resonance restricts protein backbone folding."
                    ),
                    targetMins = 45
                ),
                StudyDayTopic(
                    id = "bch_202_1",
                    subjectCode = "BCH",
                    subjectName = "Biochemistry",
                    moduleCode = "BCH 202",
                    moduleTitle = "Intermediary metabolism",
                    dayNum = 2,
                    title = "Glycolysis & regulation (PFK-1)",
                    brief = "Preparatory and payoff phases of glycolysis, net ATP yield, key irreversible steps.",
                    anki = "Regulatory cloze card on PFK-1 allosteric effectors (F-2,6-BP, ATP, AMP, Citrate).",
                    recallQuestions = listOf(
                        "Which three enzymatic reactions in glycolysis are thermodynamically irreversible?",
                        "How does fructose-2,6-bisphosphate regulate glycolysis and gluconeogenesis reciprocally?"
                    ),
                    targetMins = 55
                )
            )
        )
    )

    fun getAllTopics(): List<StudyDayTopic> = subjects.flatMap { it.topics }
}
