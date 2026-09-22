import {IsString,IsNumber, IsBoolean, IsEmail, IsPhoneNumber, IsDate, MinLength} from 'class-validator';
export class RegisterDTO {
    @IsString()
    firstName: string;
    @IsString()
    lastName: string;
    @IsEmail()          
    email: string;
    @IsNumber()
    drivingLicenseNumber: number;
    @IsString()
    province: string;
    @IsString()
    district: string;
    @IsString()
    sector: string;
    @IsString()
    village: string;
    @IsPhoneNumber()
    phoneNumber: number;


    @IsString()
    @MinLength(8)
    password: string;


    @IsDate()
    hiredAt: string;

    @IsBoolean()
    termsApproed: boolean;


    @IsBoolean()
    accountStatus: boolean;
}