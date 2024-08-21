import { PickType } from "@nestjs/swagger";
import { CreateUsuarioDto } from "./createUsuario.dto";


export class LoginUsuarioDto extends PickType(CreateUsuarioDto, ['email', 'senha'] as const) {}
