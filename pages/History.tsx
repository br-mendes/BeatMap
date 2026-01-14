import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Music4, Trash2 } from 'lucide-react';
import { SocialShare } from '../components/SocialShare';

interface HistoryProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ items, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-beatmap-secondary/20 to-transparent p-8 rounded-3xl border border-beatmap-border/10">
        <h1 className="text-3xl font-bold mb-2">Seu Histórico</h1>
        <p className="text-beatmap-muted">Acompanhe todas as playlists que você gerou através do BeatMap.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-beatmap-card/50 rounded-2xl border border-dashed border-beatmap-border/10">
          <Music4 className="mx-auto h-12 w-12 text-beatmap-muted mb-4" />
          <h3 className="text-lg font-medium text-beatmap-text">Nenhuma playlist criada ainda</h3>
          <p className="text-beatmap-muted mt-1">Vá para a aba Descobrir e selecione alguns lançamentos!</p>
        </div>
      ) : (
        <div className="bg-beatmap-card/50 rounded-2xl overflow-hidden border border-beatmap-border/10">
          <table className="w-full text-left">
            <thead className="bg-beatmap-bg/40 text-xs uppercase text-beatmap-muted font-medium">
              <tr>
                <th className="px-6 py-4">Nome da Playlist</th>
                <th className="px-6 py-4 hidden md:table-cell">Releases</th>
                <th className="px-6 py-4 hidden md:table-cell">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beatmap-border/5">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-beatmap-text/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-beatmap-primary to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                        BM
                      </div>
                      <div className="min-w-0">
                          <span className="font-medium text-beatmap-text block truncate">{item.playlistName}</span>
                          <div className="md:hidden text-xs text-beatmap-muted flex gap-2">
                             <span>{item.trackCount} faixas</span>
                             <span>•</span>
                             <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-beatmap-muted hidden md:table-cell">{item.trackCount} faixas</td>
                  <td className="px-6 py-4 text-beatmap-muted hidden md:table-cell">
                    <div className="flex items-center gap-2">
                         <Clock size={14} />
                        {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      
                      <SocialShare 
                        spotifyUrl={item.spotifyUrl}
                        shareTitle={`Playlist: ${item.playlistName}`}
                        shareText={`Confira essa playlist que criei no BeatMap: ${item.playlistName}`}
                        size="sm"
                      />

                      <div className="w-px h-4 bg-beatmap-border/20 mx-1"></div>

                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-beatmap-muted hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"
                        title="Excluir do histórico"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};