
enum SlideType {
    STRAIGHT, // SI_ / -
    CURVE_L, // SCL / <
    CURVE_R, // SCR / >
    CENTER_ROTATION_LEFT, // SUL / p
    CENTER_ROTATION_RIGHT, // SUR / q
    LETTER_S_LEFT, // SSL / s
    LETTER_S_RIGHT, // SSR / z
    LETTER_V, // SV_ / v
    SIDE_ROTATION_L, // SXL / pp
    SIDE_ROTATION_R, // SXR / qq
    L_TAG_L, // SLL / V
    L_TAG_R, // SLR / V
    FAN // SF_ / w
}

export default SlideType;
