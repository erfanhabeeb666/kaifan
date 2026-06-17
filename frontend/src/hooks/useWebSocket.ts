import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { getQueue } from '../api/endpoints';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { WebSocketEvent, CallLogResponse, EmployeeResponse, AgentDiallingResponse } from '../types';

export const useWebSocket = () => {
  const clientRef = useRef<Client | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { updateActiveCall, updateEmployee, updateQueue } = useDashboardStore();
  const queryClient = useQueryClient();

  const handleEvent = useCallback(
    async (event: WebSocketEvent) => {
      // Auto-refresh lists on any telemetry event
      queryClient.invalidateQueries({ queryKey: ['callHistory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['petpoojaOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      switch (event.type) {
        case 'NEW_CALL':
          toast('📞 New incoming call!', { icon: '📞', duration: 4000 });
          updateActiveCall(event.payload as CallLogResponse);
          break;
        case 'CALL_CONNECTED':
          toast.success('Call connected!', { duration: 3000 });
          updateActiveCall(event.payload as CallLogResponse);
          break;
        case 'CALL_COMPLETED':
          toast.success('Call completed', { duration: 3000 });
          updateActiveCall(null);
          break;
        case 'CALL_MISSED':
          toast.error('Call missed!', { duration: 5000 });
          updateActiveCall(null);
          break;
        case 'QUEUE_UPDATED': {
          try {
            const res = await getQueue();
            updateQueue(res.data.data);
          } catch {
            // silently fail
          }
          break;
        }
        case 'EMPLOYEE_STATUS_CHANGED':
          updateEmployee(event.payload as EmployeeResponse);
          break;
        case 'AGENT_DIALLING': {
          const agentData = event.payload as AgentDiallingResponse;
          const agentLabel = agentData.agentName || agentData.dialWhomNumber;
          toast(`📲 Dialling ${agentLabel}...`, {
            icon: '📲',
            duration: 5000,
            style: {
              background: '#0EA5E9',
              color: '#fff',
              fontWeight: 600,
            },
          });
          
          const myEmpId = useAuthStore.getState().employeeId;
          if (myEmpId && agentData.agentId === myEmpId) {
            // It's ringing for this employee, fetch their active call so the popup opens immediately
            import('../api/endpoints').then(({ getActiveCallForEmployee }) => {
              getActiveCallForEmployee(myEmpId).then((res) => {
                if (res.data.data) {
                  updateActiveCall(res.data.data);
                }
              }).catch(console.error);
            });
          }
          break;
        }
      }
    },
    [updateActiveCall, updateEmployee, updateQueue, queryClient]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const wsUrl = `${window.location.origin}/ws`;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe('/topic/dashboard', (message) => {
          try {
            const event: WebSocketEvent = JSON.parse(message.body);
            handleEvent(event);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
    };
  }, [isAuthenticated, handleEvent]);
};
