import React, { useState } from 'react';
import { Input, Button, Card, message, Typography, Rate, Tag, Slider, InputNumber, Space, Spin, List, Avatar, Collapse, Descriptions } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, TrophyOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

interface ExtractedInfo {
  name: string;
  contact: {
    email: string;
    phone: string;
  };
  skills: string[];
  experience: Array<{
    role: string;
    company: string;
    duration: string;
  }>;
  education: string;
  strengths: string[];
  weaknesses: string[];
  key_achievements: string[];
  current_role: string;
  location: string;
}

interface Match {
  raw_content: string;
  extracted_info: ExtractedInfo;
  metadata: {
    filename: string;
    timestamp: string;
  };
  similarity_score: number;
}

interface CandidatesProps {
  apiToken: () => Promise<string | null>;
  personDetailsUrl: string;
  defaultCollection: string[];
  username: string;
}

interface SearchResponse {
  matches: Match[];
  total_matches: number;
  message: string;
}

const Candidates: React.FC<CandidatesProps> = ({
  apiToken,
  personDetailsUrl,
  defaultCollection,
  username,
}) => {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [numResults, setNumResults] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  const handleSearch = async () => {
    if (!searchPrompt.trim()) {
      message.warning('Please enter a search prompt');
      return;
    }

    setIsLoading(true);
    try {
      const token = await apiToken();
      
      const payload = {
        search_prompt: searchPrompt,
        collection_name: defaultCollection[0],
        similarity_threshold: Number(similarityThreshold),
        num_results: Number(numResults),
        username: username
      };

      const response = await fetch(personDetailsUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
        message.success(`Found ${data.total_matches} matching candidates`);
      } else {
        const errorText = await response.text();
        console.error('Search failed:', response.status, errorText);
        message.error(`Failed to search candidates: ${response.status}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Error searching candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const renderExperience = (experience: ExtractedInfo['experience'] = []) => (
    <List
      size="small"
      dataSource={experience}
      renderItem={item => (
        <List.Item>
          <Text strong>{item.role}</Text> at {item.company} ({item.duration})
        </List.Item>
      )}
    />
  );

  const renderTagList = (items: string[] = [], color: string = 'blue') => (
    <Space wrap>
      {items.map((item, index) => (
        <Tag color={color} key={index}>{item}</Tag>
      ))}
    </Space>
  );

  const renderContactInfo = (contact: Partial<ExtractedInfo['contact']> = {}) => (
    <>
      {contact?.email && (
        <Descriptions.Item label={<><MailOutlined /> Email</>}>
          {contact.email}
        </Descriptions.Item>
      )}
      {contact?.phone && (
        <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
          {contact.phone}
        </Descriptions.Item>
      )}
    </>
  );

  return (
    <div className="candidates-search">
      <Title level={2}>Search Candidates</Title>
      
      <Card title="Search Parameters" style={{ marginBottom: '20px' }}>
        <Input.TextArea
          placeholder="Example: Looking for a senior software engineer with 5+ years of experience in React and Node.js"
          value={searchPrompt}
          onChange={(e) => setSearchPrompt(e.target.value)}
          rows={4}
          style={{ marginBottom: '16px' }}
        />

        <div style={{ marginBottom: '16px' }}>
          <Text strong>Similarity Threshold</Text>
          <Space style={{ width: '100%', marginTop: '8px' }}>
            <Slider
              style={{ width: '100%' }}
              min={0}
              max={1}
              step={0.1}
              value={similarityThreshold}
              onChange={setSimilarityThreshold}
            />
            <InputNumber
              min={0}
              max={1}
              step={0.1}
              value={similarityThreshold}
              onChange={(value) => setSimilarityThreshold(value || 0)}
              style={{ width: '70px' }}
            />
          </Space>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Text strong>Number of Results</Text>
          <div style={{ marginTop: '8px' }}>
            <InputNumber
              min={1}
              max={50}
              value={numResults}
              onChange={(value) => setNumResults(value || 20)}
              style={{ width: '100px' }}
            />
          </div>
        </div>

        <Button
          type="primary"
          onClick={handleSearch}
          loading={isLoading}
          block
        >
          Search Candidates
        </Button>
      </Card>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Searching candidates...</Text>
          </div>
        </div>
      ) : (
        <List
          itemLayout="vertical"
          size="large"
          pagination={{
            pageSize: 5,
            total: matches.length,
          }}
          dataSource={matches}
          renderItem={(match) => {
            const info = match.extracted_info || {};
            return (
              <Card 
                style={{ marginBottom: '16px' }}
                title={
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Avatar size="large" icon={<UserOutlined />} />
                      <div>
                        <Title level={4} style={{ margin: 0 }}>{info.name || 'Unknown'}</Title>
                        <Text type="secondary">{info.current_role || 'Role not specified'}</Text>
                      </div>
                    </Space>
                    <Rate 
                      disabled 
                      allowHalf 
                      defaultValue={match.similarity_score * 5}
                      style={{ color: '#1890ff' }}
                    />
                  </Space>
                }
              >
                <Descriptions column={2}>
                  {info.location && (
                    <Descriptions.Item label={<><EnvironmentOutlined /> Location</>}>
                      {info.location}
                    </Descriptions.Item>
                  )}
                  {renderContactInfo(info.contact)}
                  <Descriptions.Item label="Match Score">
                    {(match.similarity_score * 100).toFixed(1)}%
                  </Descriptions.Item>
                </Descriptions>

                <Collapse ghost style={{ marginTop: '16px' }}>
                  <Panel header="Skills & Strengths" key="1">
                    <Descriptions column={1}>
                      {info.skills && info.skills.length > 0 && (
                        <Descriptions.Item label="Skills">
                          {renderTagList(info.skills, 'blue')}
                        </Descriptions.Item>
                      )}
                      {info.strengths && info.strengths.length > 0 && (
                        <Descriptions.Item label="Strengths">
                          {renderTagList(info.strengths, 'green')}
                        </Descriptions.Item>
                      )}
                      {info.weaknesses && info.weaknesses.length > 0 && (
                        <Descriptions.Item label="Areas for Improvement">
                          {renderTagList(info.weaknesses, 'orange')}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Panel>

                  {info.experience && info.experience.length > 0 && (
                    <Panel header="Experience & Education" key="2">
                      <Descriptions column={1}>
                        <Descriptions.Item label="Experience">
                          {renderExperience(info.experience)}
                        </Descriptions.Item>
                        {info.education && (
                          <Descriptions.Item label="Education">
                            {info.education}
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Panel>
                  )}

                  {info.key_achievements && info.key_achievements.length > 0 && (
                    <Panel header="Key Achievements" key="3">
                      <List
                        size="small"
                        dataSource={info.key_achievements}
                        renderItem={achievement => (
                          <List.Item>
                            <Space>
                              <TrophyOutlined style={{ color: '#faad14' }} />
                              <Text>{achievement}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </Panel>
                  )}

                  <Panel header="Resume Details" key="4">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Filename">
                        {match.metadata?.filename || 'Unknown'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Upload Date">
                        {match.metadata?.timestamp ? 
                          new Date(match.metadata.timestamp).toLocaleDateString() : 
                          'Unknown'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Panel>
                </Collapse>
              </Card>
            );
          }}
        />
      )}
    </div>
  );
};

export default Candidates; 