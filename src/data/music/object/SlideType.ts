
enum SlideType {
    STRAIGHT, // SI_ / -
    CURVE_L, // SCL / < (Counter-clockwise)
    CURVE_R, // SCR / > (Clockwise)
    CENTER_ROTATION_LEFT, // SUL / p
    CENTER_ROTATION_RIGHT, // SUR / q
    LETTER_S_LEFT, // SSL / s
    LETTER_S_RIGHT, // SSR / z
    LETTER_V, // SV_ / v
    SIDE_ROTATION_L, // SXL / pp
    SIDE_ROTATION_R, // SXR / qq
    REFRACTIVE_L, // SLL / V
    REFRACTIVE_R, // SLR / V
    FAN // SF_ / w
}

export default SlideType;
