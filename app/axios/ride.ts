import { axiosProcessor, rootApi } from ".";

const rideApi = rootApi + "/api/v1/ride";
// √ride-request
export const requestRide = async (data: any) => {
    try {
    const response = await axiosProcessor({
    method: "post",
    url: `${rideApi}/ride-request`,
    isPrivate: true,
    obj: data,
    })
        return response.data
    } catch (error) {
        console.log(error)
    }
    
}
