import {
  EXECUTION_PACKET_QC_STATUS,
  EXECUTION_PACKET_STATUS,
  createExecutionPacket,
} from "./executionPacketRepository.js";

export function persistExecutionPacket(packet, operatorShortlist = [], rankedOperators = []) {
  if (!packet?.packetId) {
    throw new Error("persistExecutionPacket requires a packet with packetId");
  }

  return createExecutionPacket({
    ...packet,
    operatorShortlist,
    rankedOperators,
    status: EXECUTION_PACKET_STATUS.CREATED,
    qcStatus: EXECUTION_PACKET_QC_STATUS.NOT_REVIEWED,
  });
}
