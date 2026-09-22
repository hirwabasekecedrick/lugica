
export type LoginPayload = {
    email: string;
    password: string;
}
export type RegisterDriverPayload = {
    firstName: string;
    lastName: string;
    email: string;
    drivingLicenseNumber: number;
    province: string;
    district: string;
    sector: string;
    village: string;
    
    phoneNumber: number;
    password: string;
    hiredAt: string;

    termsApproed: boolean;
    accountStatus: boolean;

}