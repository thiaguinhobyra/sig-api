import { IsCPF } from 'brazilian-class-validator';
import { IsNotEmpty } from 'class-validator';


export class CpfDto {
	@IsNotEmpty({ message: "O 'cpf' deve ser informada." })
	@IsCPF({ message: "O 'cpf' deve ser válido." })
	cpf: string;
}
