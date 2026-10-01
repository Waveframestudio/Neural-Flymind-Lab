/* Conectoma Funcional de Drosophila melanogaster
 * Simplificado a partir de datos del conectoma FlyWire en ~70 grupos neuronales funcionales.
 *
 * Convención de nombres de neuronas:
 *   Sensoriales:    VIS_*, OLF_*, GUS_*, MECH_*, THERMO
 *   Centrales:      MB_*, LH_*, CX_*, SEZ_*, DN_*, GNG_*, ANTENNAL_*
 *   Motivaciones:   DRIVE_*
 *   Motoras:        MN_*
 *
 * Magnitudes de pesos de conexión:
 *   Excitatorio fuerte:      8-15  (escapes, sobresaltos)
 *   Excitatorio moderado:    4-7   (vías neuronales estándar)
 *   Excitatorio débil:       1-3   (modulatorio, fondo)
 *   Inhibitorio:             -3 a -10
 *
 * Basado en: Dorkenwald et al. 2024, Conectoma completo de cerebro FlyWire;
 * Hulse et al. 2021, complejo central; Aso et al. 2014, cuerpo pedunculado.
 */

var weights = {

	// ============================================================
	// NEURONAS DE ENTRADA SENSORIAL
	// ============================================================

	// --- Visual ---

	// Fotorreceptores R1-R6 detectores de movimiento (fotorreceptores externos)
	VIS_R1R6: {
		VIS_ME: 8,           // objetivo principal: médula
		VIS_LPTC: 4,        // vía directa de flujo óptico
		DRIVE_CURIOSITY: 2, // novedad visual
	},

	// Fotorreceptores R7/R8 para color (fotorreceptores internos)
	VIS_R7R8: {
		VIS_ME: 6,           // procesamiento en médula
		LH_APP: 4,          // atracción innata al color (UV, azul-verde)
		MB_KC: 3,           // asociaciones aprendidas de color
	},

	// Médula (procesamiento visual intermedio, neuronas columnares)
	VIS_ME: {
		VIS_LO: 7,          // hacia la lóbula para reconocimiento de patrones
		VIS_LPTC: 6,        // movimiento -> flujo óptico
		VIS_LC: 5,          // capa de detección de acercamiento/amenaza
		CX_EPG: 3,          // entrada de rumbo visual
	},

	// Lóbula (reconocimiento de patrones visuales, detección de objetos)
	VIS_LO: {
		VIS_LC: 5,          // objeto -> canal de peligro/amenaza
		MB_KC: 4,           // aprendizaje visual vía cuerpo pedunculado
		CX_EPG: 3,          // puntos de referencia visuales para la brújula
		LH_APP: 2,          // cierta atracción visual innata
	},

	// Neuronas columnares de la lóbula (detección de colisión / acercamiento rápido)
	VIS_LC: {
		DN_STARTLE: 12,     // fuerte: objeto en acercamiento desencadena escape
		DRIVE_FEAR: 6,      // amenaza visual aumenta el miedo
		DN_FLIGHT: 5,       // inicia la respuesta de vuelo
		GNG_DESC: 3,        // alerta general
	},

	// Células tangenciales de la placa de la lóbula (flujo óptico / estimación de automovimiento)
	VIS_LPTC: {
		CX_EPG: 6,          // actualiza la estimación de rumbo
		CX_HDELTA: 5,       // corrección de rumbo por flujo óptico
		CX_PFN: 4,          // entrada de integración de trayectorias
		DN_TURN: 3,         // giros compensatorios
	},

	// --- Olfativas ---

	// Neuronas receptoras olfativas -- olores a alimento
	OLF_ORN_FOOD: {
		OLF_PN: 10,         // proyección fuerte a PN
		OLF_LN: 5,          // interneuronas laterales para contraste
		MB_KC: 2,           // vía directa débil hacia KC
	},

	// Neuronas receptoras olfativas -- olores de peligro o nocivos
	OLF_ORN_DANGER: {
		OLF_PN: 10,         // proyección fuerte a PN
		OLF_LN: 5,          // interneuronas laterales para contraste
		DRIVE_FEAR: 3,      // olor nocivo eleva el miedo
	},

	// Interneuronas locales olfativas (inhibición lateral en el lóbulo antenal)
	OLF_LN: {
		OLF_PN: 4,           // señal de olor afinada para neuronas de proyección
		OLF_ORN_FOOD: -2,    // inhibición lateral (mejora de contraste)
		OLF_ORN_DANGER: -2,  // inhibición lateral
	},

	// Neuronas olfativas de proyección (relevo del lóbulo antenal hacia MB y LH)
	OLF_PN: {
		MB_KC: 8,           // entrada principal al cuerpo pedunculado
		LH_APP: 5,          // vía apetitiva innata
		LH_AV: 5,           // vía aversiva innata
	},

	// --- Gustativas ---

	// Receptores de sabor dulce
	GUS_GRN_SWEET: {
		SEZ_FEED: 10,       // fuerte: el azúcar desencadena la alimentación
		MB_DAN_REW: 7,      // señal de recompensa al cuerpo pedunculado
		MB_MBON_APP: 4,     // refuerza la memoria apetitiva
		DRIVE_HUNGER: -5,   // alimentarse reduce la señal de hambre
	},

	// Receptores de sabor amargo
	GUS_GRN_BITTER: {
		SEZ_FEED: -8,       // suprime la alimentación
		MB_DAN_PUN: 7,      // señal de castigo
		DRIVE_FEAR: 4,      // lo amargo desencadena alarma leve
		MB_MBON_AV: 5,      // formación de memoria aversiva
		LH_AV: 4,           // aversión innata
	},

	// Receptores de sabor a agua
	GUS_GRN_WATER: {
		SEZ_WATER: 8,       // desencadenante principal para beber agua
		SEZ_FEED: 3,        // solapamiento parcial con alimentación
		MB_DAN_REW: 3,      // recompensa leve
	},

	// --- Mecanosensoriales ---

	// Neuronas de cerda/queto (tacto)
	MECH_BRISTLE: {
		SEZ_GROOM: 6,       // el tacto desencadena acicalado
		DRIVE_GROOM: 4,     // eleva la necesidad de acicalarse
		DRIVE_FEAR: 5,      // el tacto asusta
		DN_STARTLE: 7,      // tacto fuerte desencadena sobresalto
		GNG_DESC: 3,        // excitación general
		ANTENNAL_MECH: 2,   // acoplamiento leve
	},

	// Órgano de Johnston (viento, gravedad, sonido vía antenas)
	MECH_JO: {
		ANTENNAL_MECH: 10,  // objetivo principal
		CX_HDELTA: 4,       // dirección del viento -> cambio de rumbo
		DN_STARTLE: 3,      // el viento puede sobresaltar
		DRIVE_FEAR: 2,      // viento moderado eleva la alerta
	},

	// Órganos cordotonales (propriocepción, posición corporal)
	MECH_CHORD: {
		CX_PFN: 5,          // integración de trayectoria (retroalimentación propioceptiva)
		CX_FC: 3,           // coordinación de locomoción
		DN_WALK: 2,         // bucle de retroalimentación de marcha
	},

	// --- Termosensoriales ---

	// Neuronas detectoras de calor (activadas por alta temperatura)
	THERMO_WARM: {
		CX_HDELTA: 4,       // orientar lejos del calor
		LH_AV: 3,           // evitación innata al calor
		DRIVE_FEAR: 2,      // aversión al calor
		THERMO_COOL: -2,    // inhibición mutua
	},

	// Neuronas detectoras de frío (activadas por baja temperatura)
	THERMO_COOL: {
		CX_HDELTA: 3,       // orientar hacia el calor
		LH_APP: 2,          // la búsqueda de ambiente fresco puede ser apetitiva
		DRIVE_CURIOSITY: 2, // frío moderado promueve la exploración
		THERMO_WARM: -2,    // inhibición mutua
	},

	// Neuronas nociceptivas (dolor / daño tisular, multimodal)
	NOCI: {
		DN_STARTLE: 10,     // el dolor desencadena escape
		DRIVE_FEAR: 8,      // el dolor eleva fuertemente el miedo
		DN_FLIGHT: 6,       // el dolor promueve el vuelo
		SEZ_GROOM: 4,       // el dolor puede desencadenar acicalado (limpieza de heridas)
		SEZ_FEED: -5,       // el dolor suprime la alimentación
	},


	// ============================================================
	// NEURONAS DE PROCESAMIENTO CENTRAL
	// ============================================================

	// --- Cuerpo Pedunculado (aprendizaje y memoria) ---

	// Células de Kenyon (código disperso de olores)
	MB_KC: {
		MB_MBON_APP: 6,     // salida apetitiva
		MB_MBON_AV: 6,      // salida aversiva
		MB_APL: 4,          // retroalimentación a neurona inhibitoria (codificación dispersa)
	},

	// Neuronas de salida del MB -- apetitivas/acercamiento
	MB_MBON_APP: {
		LH_APP: 5,          // refuerza el acercamiento
		SEZ_FEED: 4,        // asociación aprendida de comida -> alimentación
		DN_WALK: 3,         // comportamiento de aproximación
		CX_FC: 3,           // locomoción hacia el objetivo
		MB_MBON_AV: -4,     // inhibición mutua con aversivas
	},

	// Neuronas de salida del MB -- aversivas/evitación
	MB_MBON_AV: {
		LH_AV: 5,           // refuerza la evitación
		DRIVE_FEAR: 4,      // peligro aprendido eleva el miedo
		DN_STARTLE: 3,      // desencadena evitación
		MB_MBON_APP: -4,    // inhibición mutua con apetitivas
		SEZ_FEED: -3,       // suprime alimentación ante estímulos aversivos
	},

	// Neurona lateral pareada anterior (inhibición global en cuerpo pedunculado)
	MB_APL: {
		MB_KC: -5,           // codificación dispersa: suprime KCs débilmente activas
		MB_MBON_APP: -2,     // inhibición leve de salida
		MB_MBON_AV: -2,      // inhibición leve de salida
	},

	// Neuronas dopaminérgicas de recompensa
	MB_DAN_REW: {
		MB_MBON_APP: 7,     // fortalece la salida apetitiva
		MB_KC: 3,           // plasticidad regulada por recompensa
		DRIVE_CURIOSITY: 2, // la recompensa fomenta la exploración
	},

	// Neuronas dopaminérgicas de castigo
	MB_DAN_PUN: {
		MB_MBON_AV: 7,      // fortalece la salida aversiva
		MB_KC: 3,           // plasticidad regulada por castigo
		DRIVE_FEAR: 3,      // el castigo eleva el miedo
	},

	// --- Cuerno Lateral (respuestas innatas a olores) ---

	// Vía apetitiva del cuerno lateral
	LH_APP: {
		DN_WALK: 6,          // aproximación: caminar hacia la fuente
		CX_FC: 4,           // comando de locomoción
		SEZ_FEED: 3,        // sesgo hacia la alimentación
		DN_TURN: 3,         // orientar hacia estímulo atractivo
		LH_AV: -3,          // inhibición mutua
	},

	// Vía aversiva del cuerno lateral
	LH_AV: {
		DN_STARTLE: 6,       // evitar: sobresalto/huida
		DRIVE_FEAR: 5,       // elevar el miedo
		DN_FLIGHT: 4,        // desencadenar vuelo
		DN_TURN: 4,          // girar en dirección opuesta
		LH_APP: -3,          // inhibición mutua
		SEZ_FEED: -5,        // suprimir alimentación
	},

	// --- Complejo Central (navegación, orientación, locomoción) ---

	// Neuronas brújula (representación de rumbo)
	CX_EPG: {
		CX_PFN: 7,          // rumbo -> integración de trayectoria
		CX_FC: 6,           // rumbo -> locomoción
		CX_HDELTA: 4,       // retroalimentación de rumbo
		CX_EPG: 3,          // recurrente: atractor de anillo de rumbo
	},

	// Neuronas de integración de trayectoria
	CX_PFN: {
		CX_FC: 6,            // integración de trayectoria -> comando de locomoción
		CX_EPG: 3,           // retroalimentación a la brújula
		CX_HDELTA: 3,        // corrección de rumbo
	},

	// Cuerpo en abanico (centro de mando de locomoción)
	CX_FC: {
		DN_WALK: 8,          // comando principal de marcha
		DN_TURN: 5,          // comando de giro
		CX_EPG: 2,           // retroalimentación a la brújula
		CX_FC: 3,            // recurrente: actividad tónica de locomoción
		DN_FLIGHT: -2,       // la marcha suprime el vuelo
	},

	// Neuronas de cambio de rumbo
	CX_HDELTA: {
		CX_EPG: 5,           // actualizar rumbo
		DN_TURN: 6,          // ejecutar giro
		CX_FC: 3,            // influir en la locomoción
	},

	// --- Zona Subesofágica (mando de alimentación y acicalado) ---

	// Centro de mando de alimentación
	SEZ_FEED: {
		MN_PROBOSCIS: 14,    // extender probóscide
		MN_HEAD: 4,          // bajar cabeza hacia el alimento
		DN_WALK: -6,         // suprimir marcha durante alimentación
		DN_FLIGHT: -5,       // suprimir vuelo durante alimentación
		SEZ_GROOM: -4,       // suprimir acicalado durante alimentación
		DRIVE_HUNGER: -3,    // alimentarse reduce el hambre
	},

	// Centro de mando de acicalado
	SEZ_GROOM: {
		MN_LEG_L1: 10,       // pata delantera izquierda (efector de acicalado)
		MN_LEG_R1: 10,       // pata delantera derecha (efector de acicalado)
		MN_ABDOMEN: 5,       // acicalado de abdomen
		MN_HEAD: 4,          // posicionamiento de cabeza para acicalado
		DN_WALK: -5,          // suprimir marcha durante acicalado
		DN_FLIGHT: -4,        // suprimir vuelo durante acicalado
		SEZ_FEED: -3,         // suprimir alimentación durante acicalado
	},

	// --- Centro mecanosensorial antenal ---

	ANTENNAL_MECH: {
		DN_STARTLE: 5,        // viento fuerte -> sobresalto
		CX_HDELTA: 4,         // orientación con el viento
		DRIVE_FEAR: 3,        // viento eleva la alerta
		DN_TURN: 3,           // orientarse al viento
	},

	// --- Neuronas descendentes de los ganglios gnatales ---

	GNG_DESC: {
		DN_WALK: 4,           // excitación general -> caminar
		SEZ_FEED: 2,          // la excitación puede desencadenar búsqueda de comida
		CX_FC: 4,             // activación de locomoción
		GNG_DESC: 2,          // recurrente: excitación autosostenida
	},

	// --- Neuronas Descendentes (comandos del cerebro al VNC) ---

	// Comando de marcha
	DN_WALK: {
		VNC_CPG: 8,           // activa el generador central de patrones
		MN_LEG_L1: 4,        // activación motora directa (complementa CPG)
		MN_LEG_R1: 4,        // delantera derecha
		MN_LEG_L2: 5,        // media izquierda (impulsores principales)
		MN_LEG_R2: 5,        // media derecha
		MN_LEG_L3: 3,        // trasera izquierda
		MN_LEG_R3: 3,        // trasera derecha
		CX_FC: 2,            // retroalimentación: la marcha sostiene el comando de locomoción
		DN_FLIGHT: -3,        // caminar suprime el vuelo
	},

	// Iniciación de vuelo
	DN_FLIGHT: {
		MN_WING_L: 10,       // ala izquierda
		MN_WING_R: 10,       // ala derecha
		MN_LEG_L1: -3,       // suprimir movimiento de patas durante el vuelo
		MN_LEG_R1: -3,
		MN_LEG_L2: -3,
		MN_LEG_R2: -3,
		MN_LEG_L3: -3,
		MN_LEG_R3: -3,
		DN_WALK: -5,          // el vuelo suprime la marcha
	},

	// Comando de giro
	DN_TURN: {
		MN_LEG_L1: 4,        // asimétrico: más a la izquierda = giro a la derecha
		MN_LEG_L2: 5,
		MN_LEG_L3: 3,
		MN_LEG_R1: -3,       // ralentizar lado derecho
		MN_LEG_R2: -4,
		MN_LEG_R3: -2,
		MN_HEAD: 4,           // giros de cabeza
	},

	// Comando de marcha atrás
	DN_BACKUP: {
		MN_LEG_L3: 5,         // patas traseras empujan hacia adelante (invertido)
		MN_LEG_R3: 5,
		MN_LEG_L2: 3,
		MN_LEG_R2: 3,
		MN_LEG_L1: -2,        // patas delanteras se retraen
		MN_LEG_R1: -2,
		DN_WALK: -4,           // caminar hacia atrás suprime la marcha hacia adelante
	},

	// Comando de sobresalto/escape
	DN_STARTLE: {
		DN_FLIGHT: 10,        // sobresalto -> vuelo
		MN_WING_L: 8,         // activación inmediata de alas
		MN_WING_R: 8,
		MN_LEG_L2: 5,         // salto: patas medias se extienden
		MN_LEG_R2: 5,
		MN_LEG_L3: 6,         // salto: patas traseras se extienden
		MN_LEG_R3: 6,
		DN_BACKUP: 5,          // sobresalto puede desencadenar salto hacia atrás
		DRIVE_FEAR: 4,         // sobresalto eleva el miedo
		DN_WALK: -4,           // suprimir marcha normal
		SEZ_FEED: -6,          // suprimir alimentación
		SEZ_GROOM: -5,         // suprimir acicalado
	},

	// Generador central de patrones de la cadena nerviosa ventral (ritmo de marcha)
	VNC_CPG: {
		MN_LEG_L1: 3,         // activación rítmica de todas las patas
		MN_LEG_R1: 3,
		MN_LEG_L2: 4,         // patas medias ligeramente más fuertes (impulsores principales)
		MN_LEG_R2: 4,
		MN_LEG_L3: 3,
		MN_LEG_R3: 3,
		VNC_CPG: 2,           // oscilación autosostenida
	},

	// Neuronas del reloj circadiano (marcapasos, modula niveles de actividad)
	CLOCK_DN: {
		DRIVE_FATIGUE: 2,      // el reloj influye en el cansancio
		DRIVE_CURIOSITY: 2,    // el reloj influye en la actividad
		CX_FC: 2,             // modula la locomoción
		GNG_DESC: 2,          // modulación de excitación general
	},

	// Comando de ingesta de agua en la zona subesofágica
	SEZ_WATER: {
		MN_PROBOSCIS: 6,      // extender probóscide para beber agua
		MN_HEAD: 3,           // bajar cabeza
		DN_WALK: -3,           // suprimir marcha mientras bebe
		SEZ_FEED: -2,          // supresión leve de ingesta de alimento
	},


	// ============================================================
	// NEURONAS DE MOTIVACIONES / IMPULSOS INTERNOS
	// ============================================================

	// Impulso de hambre
	DRIVE_HUNGER: {
		OLF_PN: 5,            // el hambre sensibiliza el procesamiento olfativo
		LH_APP: 6,            // el hambre sesga hacia la aproximación apetitiva
		SEZ_FEED: 4,          // el hambre reduce el umbral de alimentación
		MB_MBON_APP: 4,       // mosca hambrienta más receptiva a señales de comida
		DN_WALK: 3,           // el hambre motiva la locomoción (búsqueda de comida)
		CX_FC: 3,             // el hambre activa el centro de locomoción
		DRIVE_CURIOSITY: 3,   // el hambre promueve la exploración
		DRIVE_FATIGUE: -2,    // el hambre se opone al descanso
	},

	// Impulso de miedo/amenaza
	DRIVE_FEAR: {
		DN_STARTLE: 5,        // el miedo reduce el umbral de sobresalto
		DN_FLIGHT: 4,         // el miedo promueve el vuelo
		LH_AV: 3,             // el miedo sesga hacia la vía aversiva
		SEZ_FEED: -6,         // el miedo suprime fuertemente la alimentación
		SEZ_GROOM: -4,        // el miedo suprime el acicalado
		DN_WALK: 2,           // el miedo promueve el movimiento (sin alimentación)
		DRIVE_CURIOSITY: -3,  // el miedo suprime la exploración
		DRIVE_FATIGUE: -2,    // el miedo anula el cansancio
	},

	// Impulso de fatiga
	DRIVE_FATIGUE: {
		DN_WALK: -6,           // la fatiga suprime la marcha
		DN_FLIGHT: -5,         // la fatiga suprime el vuelo
		CX_FC: -4,            // la fatiga reduce comandos de locomoción
		DRIVE_CURIOSITY: -3,  // la fatiga reduce la exploración
		DN_STARTLE: -2,       // la fatiga eleva levemente el umbral de sobresalto
	},

	// Impulso de curiosidad/exploración
	DRIVE_CURIOSITY: {
		CX_FC: 6,             // la curiosidad promueve la locomoción
		DN_WALK: 4,           // la curiosidad promueve la marcha
		CX_HDELTA: 5,         // la curiosidad promueve cambios de dirección
		DN_TURN: 4,           // la curiosidad promueve giros
		CX_EPG: 3,            // la curiosidad activa la brújula
		DRIVE_FATIGUE: 1,     // la exploración es ligeramente agotadora
	},

	// Impulso de acicalado
	DRIVE_GROOM: {
		SEZ_GROOM: 8,         // la necesidad de acicalarse desencadena el comando
		DN_WALK: -3,           // el acicalado suprime la marcha
		DN_FLIGHT: -2,         // el acicalado suprime el vuelo
	},


	// ============================================================
	// NEURONAS DE SALIDA MOTORA
	// ============================================================
	// Las neuronas motoras son la capa final de salida. NO se proyectan
	// de regreso al cerebro central (sin conexiones reentrantes desde
	// las neuronas motoras). Solo aparecen como objetivos postSinápticos.
	// Incluimos entradas vacías para que aparezcan en el objeto weights
	// y se inicialicen en el estado postSináptico.

	MN_LEG_L1: {},
	MN_LEG_R1: {},
	MN_LEG_L2: {},
	MN_LEG_R2: {},
	MN_LEG_L3: {},
	MN_LEG_R3: {},
	MN_WING_L: {},
	MN_WING_R: {},
	MN_PROBOSCIS: {},
	MN_HEAD: {},
	MN_ABDOMEN: {},
};
export default weights;
export { weights };
